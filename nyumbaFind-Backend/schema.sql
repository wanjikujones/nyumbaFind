-- ==========================================================================
-- NYUMBAFIND — SUPABASE SCHEMA
-- Run this once in your Supabase project's SQL editor
-- (Dashboard → SQL Editor → New query → paste all of this → Run)
-- ==========================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- 1. TABLE
-- --------------------------------------------------------------------------
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  price integer not null,
  size text not null,
  constituency text not null,
  ward text not null,
  landmark text,
  phone_whatsapp text not null,
  image_urls text[] not null,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- No login system, so "anon" (the public key the frontend uses) needs
-- carefully scoped permissions instead of an all-or-nothing open table.
-- --------------------------------------------------------------------------
alter table listings enable row level security;

-- Anyone can read listings
create policy "Public can read listings"
on listings for select
to anon
using (true);

-- Anyone can create a listing (this is how caretakers "log in" — by phone
-- number only, per the spec). The 30-cap check below runs as a trigger.
create policy "Public can insert listings"
on listings for insert
to anon
with check (true);

-- Anyone can delete a listing, but ONLY if it has actually expired
-- (older than 3 weeks). This lets the frontend self-clean expired
-- listings without ever being able to delete a live one.
create policy "Public can delete only expired listings"
on listings for delete
to anon
using (created_at < now() - interval '21 days');

-- --------------------------------------------------------------------------
-- 3. ENFORCE THE 30-LISTING CAP (server-side, not just in the UI)
-- --------------------------------------------------------------------------
create or replace function enforce_listing_cap()
returns trigger as $$
begin
  if (select count(*) from listings) >= 30 then
    raise exception 'LISTING_CAP_REACHED: nyumbaFind is full (30/30). Try again once a listing expires.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_enforce_listing_cap on listings;
create trigger trg_enforce_listing_cap
before insert on listings
for each row execute function enforce_listing_cap();

-- --------------------------------------------------------------------------
-- 4. OPTIONAL: server-side auto-purge every hour, so expired listings
-- disappear even if nobody visits the site to trigger the client-side
-- cleanup. Requires the pg_cron extension.
--
-- To enable: Dashboard → Database → Extensions → toggle on "pg_cron".
-- Then run the two lines below (uncomment them first).
-- --------------------------------------------------------------------------
-- create extension if not exists pg_cron;
-- select cron.schedule('purge-expired-listings', '0 * * * *',
--   $$ delete from listings where created_at < now() - interval '21 days' $$
-- );

-- ==========================================================================
-- 5. STORAGE BUCKET for listing photos
-- Create the bucket itself in the Dashboard first:
--   Storage → New bucket → name: listing-images → Public bucket: ON
-- Then run the policy below so anonymous caretakers can upload photos.
-- ==========================================================================
create policy "Public can upload listing images"
on storage.objects for insert
to anon
with check (bucket_id = 'listing-images');
