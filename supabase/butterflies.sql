-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Butterflies on the Map of La Famiglia: a listener (🐛) becomes a butterfly (🦋)
-- once they've joined La Famiglia: confirmed their email, or had a fan pin approved.
-- Until this runs, the map simply shows caterpillars as before.

-- Where each joiner was when they joined (city level, from Vercel's location
-- headers: the same source as the listener caterpillars, so the two line up)
create table if not exists public.butterflies (
  visitor_id  uuid primary key,
  latitude    double precision not null,
  longitude   double precision not null,
  city        text,
  region      text,
  country     text,
  created_at  timestamptz not null default now()
);
alter table public.butterflies enable row level security; -- server only

-- Which browser each signup / pin came from (the anonymous dc_visitor_id)
alter table public.mailing_list add column if not exists visitor_id uuid;
alter table public.fan_pins     add column if not exists visitor_id uuid;
create index if not exists mailing_list_visitor_id_idx on public.mailing_list (visitor_id);
create index if not exists fan_pins_visitor_id_idx     on public.fan_pins (visitor_id);

-- Public, anonymous counts per area: only confirmed emails and approved pins count
create or replace function public.butterfly_clusters()
returns table (
  city text, region text, country text,
  latitude double precision, longitude double precision,
  butterflies integer
)
language sql
stable
security definer
set search_path = public
as $$
  select b.city, b.region, b.country,
         avg(b.latitude)::double precision,
         avg(b.longitude)::double precision,
         count(*)::integer
  from butterflies b
  where exists (select 1 from mailing_list m where m.visitor_id = b.visitor_id and m.verified)
     or exists (select 1 from fan_pins f where f.visitor_id = b.visitor_id and f.approved)
  group by b.city, b.region, b.country;
$$;

grant execute on function public.butterfly_clusters() to anon, authenticated;
