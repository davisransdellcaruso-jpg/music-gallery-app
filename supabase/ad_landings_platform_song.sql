-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Tags each ad page with the platform it runs on and the song it promotes,
-- so /ad-stats can split Reddit and Meta and group ad sets by song.
--
-- For new ads later, fill in platform ('reddit' or 'meta') and song
-- (e.g. 'Smitten') when you add the row to ad_landings.

alter table public.ad_landings
  add column if not exists platform text,
  add column if not exists song     text;

update public.ad_landings set platform = 'reddit'
  where platform is null and slug like '%reddit%';
update public.ad_landings set platform = 'meta'
  where platform is null and slug like 'meta%';

update public.ad_landings set song = 'Smitten'
  where song is null and slug like '%smitten%';
-- Every other ad so far promotes Peace Of Mind
update public.ad_landings set song = 'Peace Of Mind'
  where song is null;

-- Check: every row should have a platform and a song
select slug, platform, song, active from public.ad_landings order by created_at desc;
