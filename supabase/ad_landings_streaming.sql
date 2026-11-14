-- Run once in Supabase (SQL Editor), after ad_landings.sql.
-- Adds the streaming buttons to ad pages. A button only shows when its link is filled in.
alter table public.ad_landings
  add column if not exists ep_name     text,
  add column if not exists spotify_url text,
  add column if not exists apple_url   text,
  add column if not exists youtube_url text;

-- Paste the three Amore EP links between the quotes:
update public.ad_landings set
  ep_name     = 'Amore',
  spotify_url = 'PASTE SPOTIFY LINK',
  apple_url   = 'PASTE APPLE MUSIC LINK',
  youtube_url = 'PASTE YOUTUBE LINK'
where slug = 'pom-reddit';
