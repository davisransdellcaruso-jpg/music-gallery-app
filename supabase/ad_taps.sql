-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Gives ad pages (/s/<slug>) their own tap log, so streaming taps from ads
-- stop landing in playlist_taps next to the business playlist.
-- Safe to run more than once.

create table if not exists public.ad_taps (
  id          bigint generated always as identity primary key,
  ad_slug     text not null,
  platform    text not null,
  tapped_at   timestamptz not null default now(),
  country     text,
  user_agent  text,
  referrer    text
);

create index if not exists ad_taps_slug_time_idx on public.ad_taps (ad_slug, tapped_at desc);

-- Only the site's server (service role key) can read or write it
alter table public.ad_taps enable row level security;

-- Move any ad taps already sitting in playlist_taps (e.g. pom-reddit) over here
with moved as (
  delete from public.playlist_taps
  where business_slug in (select slug from public.ad_landings)
  returning business_slug, platform, tapped_at, country, user_agent, referrer
)
insert into public.ad_taps (ad_slug, platform, tapped_at, country, user_agent, referrer)
select business_slug, platform, tapped_at, country, user_agent, referrer from moved;
