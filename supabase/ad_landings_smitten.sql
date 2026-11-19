-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Adds daviscaruso.com/s/smitten-reddit: the Smitten hot-springs clip on top,
-- same Take Me Home unlock, same headline, same Amore EP streaming links
-- and languages as /s/pom-reddit (copied straight from that row).
-- Upload "Smitten Hot Springs.mp4" to the "ad-clips" bucket first.

insert into public.ad_landings
  (slug, clip_file, song_file, headline_en, headline_es,
   ep_name, spotify_url, apple_url, youtube_url, languages, active)
select
  'smitten-reddit', 'Smitten Hot Springs.mp4', song_file, headline_en, headline_es,
  ep_name, spotify_url, apple_url, youtube_url, languages, true
from public.ad_landings
where slug = 'pom-reddit'
on conflict (slug) do nothing;

-- Check: should show one row for smitten-reddit
select slug, clip_file, song_file, spotify_url from public.ad_landings
where slug in ('pom-reddit', 'smitten-reddit');
