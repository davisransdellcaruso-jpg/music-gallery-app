-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Resets an ad's numbers on /ad-stats back to zero. Nothing is deleted:
-- /ad-stats just stops counting visits, taps and emails from before the reset.
-- To reset again later (or reset a different ad), re-run the UPDATE line
-- with that ad's slug.

alter table public.ad_landings add column if not exists stats_reset_at timestamptz;

update public.ad_landings set stats_reset_at = now() where slug = 'pom-reddit';
