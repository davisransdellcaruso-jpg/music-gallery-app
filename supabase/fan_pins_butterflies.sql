-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Run it BEFORE pushing the code that removes lyrics from fan pins.
--
-- 1. Fan pins no longer ask for lyrics, so `story` may be empty.
alter table public.fan_pins alter column story drop not null;
do $$
declare c record;
begin
  -- drop any length/required rules on story
  for c in
    select conname from pg_constraint
    where conrelid = 'public.fan_pins'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%story%'
  loop
    execute format('alter table public.fan_pins drop constraint %I', c.conname);
  end loop;
end $$;

-- 2. Fans with an approved pin already show as their own butterfly (with their
--    mood), so `butterflies` (the small anonymous ones) counts everyone else who
--    joined. `joined` counts everyone, so the map can retire their caterpillars.
--    (The return columns change, so the old function is dropped first.)
drop function if exists public.butterfly_clusters();
create function public.butterfly_clusters()
returns table (
  city text, region text, country text,
  latitude double precision, longitude double precision,
  butterflies integer,
  joined integer
)
language sql
stable
security definer
set search_path = public
as $$
  with j as (
    select b.*,
           exists (select 1 from fan_pins f where f.visitor_id = b.visitor_id and f.approved) as has_pin
    from butterflies b
    where exists (select 1 from fan_pins f where f.visitor_id = b.visitor_id and f.approved)
       or exists (select 1 from mailing_list m where m.visitor_id = b.visitor_id and m.verified)
  )
  select city, region, country,
         avg(latitude)::double precision,
         avg(longitude)::double precision,
         (count(*) filter (where not has_pin))::integer,
         count(*)::integer
  from j
  group by city, region, country;
$$;

grant execute on function public.butterfly_clusters() to anon, authenticated;
