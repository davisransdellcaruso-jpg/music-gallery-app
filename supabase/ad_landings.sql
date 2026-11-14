-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- One row per ad. Each row gets its own page at daviscaruso.com/s/<slug>:
-- the ad's video clip on top, then the email signup for one specific
-- unreleased Periwinkle song.
--
-- To add another ad later: upload the clip to the "ad-clips" bucket, then
-- Table Editor → ad_landings → Insert row. Set active = false to switch a page off.

create table if not exists public.ad_landings (
  slug        text primary key check (slug ~ '^[a-z0-9-]{1,32}$'),
  clip_file   text not null,          -- file name in the "ad-clips" bucket, exactly
  song_file   text not null,          -- file name in "songs from Periwinkle", exactly
  headline_en text,                   -- optional line above the clip
  headline_es text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Only the site's server (service role key) can read or write it
alter table public.ad_landings enable row level security;

-- The first ad: the Peace Of Mind clip, unlocking Take Me Home
insert into public.ad_landings (slug, clip_file, song_file, headline_en, headline_es)
values (
  'pom-reddit',
  'POM Pumpkin Tracker.mp4',
  'Take Me Home.mp3',
  'You found me. Here''s a song nobody''s heard yet.',
  'Me encontraste. Aquí tienes una canción que nadie ha escuchado.'
)
on conflict (slug) do nothing;
