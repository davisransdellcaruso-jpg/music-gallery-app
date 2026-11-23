-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Meta ads on /ad-stats get weekly folders, and each ad set shows whose
-- audience it targets that week. Also hides the retired Peace Of Mind Meta ad.
--
-- Each week runs from its starts_on date until the next week starts.
-- New week later: add a row to ad_weeks, then one ad_audiences row per ad set.

create table if not exists public.ad_weeks (
  platform  text not null default 'meta',
  week      int  not null,
  label     text,
  starts_on date not null,
  primary key (platform, week)
);

create table if not exists public.ad_audiences (
  slug     text not null,
  week     int  not null,
  audience text not null,           -- shown as "Targeting <audience> fans"
  primary key (slug, week)
);

alter table public.ad_weeks     enable row level security;
alter table public.ad_audiences enable row level security;

-- Hide retired ad sets from /ad-stats (rows and old stats stay in Supabase)
alter table public.ad_landings add column if not exists hidden boolean not null default false;
update public.ad_landings set hidden = true
  where platform = 'meta' and active = false;   -- the switched-off PoM Meta ad

-- Week 1 = from the first Meta ad until yesterday; Week 2 starts today, Nov 23
insert into public.ad_weeks (platform, week, label, starts_on)
select 'meta', 1, 'Week 1',
       min((created_at at time zone 'America/Detroit')::date)
from public.ad_landings where platform = 'meta'
on conflict (platform, week) do update set starts_on = excluded.starts_on;

insert into public.ad_weeks (platform, week, label, starts_on)
values ('meta', 2, 'Week 2', '2026-11-23')
on conflict (platform, week) do update set starts_on = excluded.starts_on;

-- Audiences. EU = slug with "eu", BR/ID = slug with "br",
-- North America = the other live Meta ad set.
insert into public.ad_audiences (slug, week, audience)
select slug, w.week,
  case
    when slug like '%eu%' then (case w.week when 1 then 'Harry Styles' else 'Ed Sheeran' end)
    when slug like '%br%' then (case w.week when 1 then 'Frank Ocean'  else 'Justin Bieber' end)
    else 'Justin Bieber'
  end
from public.ad_landings, (values (1), (2)) as w(week)
where platform = 'meta' and hidden = false
on conflict (slug, week) do update set audience = excluded.audience;

-- Check: each live Meta ad set should show the right audience for both weeks
select a.slug, a.week, a.audience
from public.ad_audiences a order by a.week, a.slug;
