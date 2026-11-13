-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Remembers when each supporter was last in the listening room, so their emailed
-- link keeps working as long as they visit at least once every 30 days.
-- Until this runs, links still work for 30 days from when they were sent.
alter table public.supporters add column if not exists room_last_active timestamptz;
