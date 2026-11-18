-- Run once in Supabase (SQL Editor).
-- Lets each ad page choose its own languages. Not set = English + Spanish.
alter table public.ad_landings add column if not exists languages text[];

-- Brazil & Indonesia: Portuguese and Indonesian only
update public.ad_landings set languages = '{pt,id}' where slug = 'meta-br-id';
