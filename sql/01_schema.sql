-- ============================================================
-- BURGER HOUSE — Supabase Schema
-- Run this once in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

create extension if not exists pgcrypto;

-- SETTINGS: one single row holding all site-wide editable content
create table if not exists settings (
  id int primary key default 1,
  hero_title text not null default 'BURGER HOUSE',
  hero_tagline text not null default 'Stacked. Grilled. Devoured.',
  about_heading text not null default 'Our Story',
  about_body text not null default 'Born on the streets of Moratuwa, Burger House started with one grill, one recipe, and a refusal to serve anything ordinary.',
  phone text not null default '+94772299827',
  whatsapp_shop text,
  address_line text not null default 'S. Thomas'' College, Moratuwa, Sri Lanka',
  maps_link text not null default 'https://maps.app.goo.gl/9Tcuv3pcDEZcJBXq6',
  maps_lat double precision default 6.8374503,
  maps_lng double precision default 79.8660067,
  instagram_link text,
  tiktok_link text,
  facebook_link text,
  ubereats_store_link text not null default 'https://www.ubereats.com/lk/store/burger-house-moratuwa/HcEXXYHXUrWlLFVVtBAYCA?diningMode=DELIVERY',
  hours jsonb not null default '{"Monday":"8AM–1AM","Tuesday":"8AM–1AM","Wednesday":"8AM–1AM","Thursday":"8AM–1AM","Friday":"8AM–1AM","Saturday":"8AM–1AM","Sunday":"8AM–1AM"}'
);

-- BANNERS: rotating hero/story banners, editable & reorderable
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  tag_label text,
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- BRANCHES: one or more shop locations
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  maps_link text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  hours jsonb, -- optional per-branch override; falls back to settings.hours if null
  sort_order int not null default 0,
  active boolean not null default true
);

-- CATEGORIES: menu sections (Fried Rice, Kottu, Submarine, etc.)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  note text,
  sort_order int not null default 0,
  active boolean not null default true
);

-- MENU ITEMS
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  description text,
  tag text,
  price_normal numeric,
  price_full numeric,
  price_note text,
  ubereats_item_link text,
  image_url text,
  active boolean not null default true,
  sort_order int not null default 0
);

-- ADD-ONS (single price list, e.g. extra cheese, extra beef)
create table if not exists addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  sort_order int not null default 0,
  active boolean not null default true
);

-- Make sure exactly one settings row exists
insert into settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- Public (anon key) can READ everything.
-- Only logged-in staff (authenticated) can WRITE.
-- ============================================================
alter table settings enable row level security;
alter table banners enable row level security;
alter table branches enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table addons enable row level security;

create policy "public read settings" on settings for select using (true);
create policy "staff write settings" on settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read banners" on banners for select using (true);
create policy "staff write banners" on banners for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read branches" on branches for select using (true);
create policy "staff write branches" on branches for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read categories" on categories for select using (true);
create policy "staff write categories" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read menu_items" on menu_items for select using (true);
create policy "staff write menu_items" on menu_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read addons" on addons for select using (true);
create policy "staff write addons" on addons for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE: bucket for banner / menu item images uploaded from the dashboard
-- ============================================================
insert into storage.buckets (id, name, public)
values ('bh-images', 'bh-images', true)
on conflict (id) do nothing;

create policy "public read bh-images" on storage.objects for select
  using (bucket_id = 'bh-images');
create policy "staff upload bh-images" on storage.objects for insert
  with check (bucket_id = 'bh-images' and auth.role() = 'authenticated');
create policy "staff update bh-images" on storage.objects for update
  using (bucket_id = 'bh-images' and auth.role() = 'authenticated');
create policy "staff delete bh-images" on storage.objects for delete
  using (bucket_id = 'bh-images' and auth.role() = 'authenticated');
