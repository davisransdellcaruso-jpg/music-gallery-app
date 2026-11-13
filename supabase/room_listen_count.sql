-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Replaces room_tracks.note with room_tracks.listen_count: how many times each
-- track has been listened to by people in the `supporters` table.
-- A listen counts once it passes 5 seconds (shorter plays are skips), the same
-- rule /studio uses. The number updates itself every time someone plays a track.
--
-- Deploy the site code that stops reading `note` BEFORE running this,
-- or the listening room will error until the new code is live.

-- 1. Swap the column
alter table public.room_tracks drop column if exists note;
alter table public.room_tracks add column if not exists listen_count integer not null default 0;

-- 2. One function that recounts a single track
create or replace function public.recount_room_track(t_id room_tracks.id%type)
returns void
language sql
security definer
set search_path = public
as $$
  update public.room_tracks rt
  set listen_count = (
    select count(*)
    from public.room_plays p
    join public.supporters s on s.email = p.email
    where p.track_id = t_id
      and p.seconds_listened >= 5
  )
  where rt.id = t_id;
$$;

-- 3. Recount whenever a listen is added, updated (seconds grow as they play) or removed
create or replace function public.room_plays_recount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recount_room_track(new.track_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.track_id is distinct from new.track_id) then
    perform public.recount_room_track(old.track_id);
  end if;
  return null;
end;
$$;

drop trigger if exists room_plays_recount on public.room_plays;
create trigger room_plays_recount
after insert or update or delete on public.room_plays
for each row execute function public.room_plays_recount();

-- 4. If someone is added to or removed from supporters, recount every track
create or replace function public.supporters_recount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recount_room_track(id) from public.room_tracks;
  return null;
end;
$$;

drop trigger if exists supporters_recount on public.supporters;
create trigger supporters_recount
after insert or delete or update of email on public.supporters
for each statement execute function public.supporters_recount();

-- 5. Fill in the counts for listens that already happened
select public.recount_room_track(id) from public.room_tracks;
