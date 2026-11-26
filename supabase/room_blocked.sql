-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Adds a "blocked" switch to the listening room's supporters list.
-- Set blocked = true on someone's row to lock them out of /room right away.
-- They can't sign back in or get a new link. Set it back to false to let them in again.
alter table public.supporters add column if not exists blocked boolean not null default false;
