-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Lets an ad skip its landing page: daviscaruso.com/s/<slug> logs the visit
-- and sends people straight to Spotify (or 'apple' / 'youtube').
-- To bring the landing page back: set direct_to = null.

alter table public.ad_landings add column if not exists direct_to text;

update public.ad_landings set direct_to = 'spotify' where slug = 'smitten-reddit';

select slug, direct_to, spotify_url from public.ad_landings where slug = 'smitten-reddit';
