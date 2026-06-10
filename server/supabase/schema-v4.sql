-- Run in Supabase SQL Editor

-- Coupons
create table if not exists coupons (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  code         text not null unique,
  type         text not null default 'percent' check (type in ('percent','fixed','free_shipping')),
  value        numeric not null default 0,
  min_purchase numeric default 0,
  max_uses     integer,
  uses_count   integer default 0,
  expires_at   timestamptz,
  active       boolean default true
);
alter table coupons enable row level security;

-- Reviews
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  product_id text not null,
  name       text not null,
  email      text not null,
  rating     integer not null check (rating between 1 and 5),
  comment    text default '',
  approved   boolean default false
);
alter table reviews enable row level security;
create policy "reviews_public_read" on reviews for select using (approved = true);

-- Wishlists
create table if not exists wishlists (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id    uuid not null,
  product_id text not null,
  unique(user_id, product_id)
);
alter table wishlists enable row level security;

-- Orders: add discount + coupon_code columns
alter table orders add column if not exists discount  numeric default 0;
alter table orders add column if not exists coupon_code text;

-- Products: add quantity column (for low-stock alerts)
alter table products add column if not exists quantity integer;
