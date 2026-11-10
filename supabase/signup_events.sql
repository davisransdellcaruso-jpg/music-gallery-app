-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Counts each step of the email signup so /signup-stats can show where
-- people drop off and which links (?src=ig, ?src=tt, ...) bring signups.
-- Until this runs, the site works exactly as before; the steps just aren't counted.

create table if not exists public.signup_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  event       text not null check (event in ('shown', 'dismissed', 'button', 'submitted', 'confirmed')),
  source      text not null default 'direct',
  visitor_id  uuid,
  page        text,
  country     text
);

create index if not exists signup_events_created_at_idx on public.signup_events (created_at desc);

-- Only the site's server (service role key) can read or write it
alter table public.signup_events enable row level security;
