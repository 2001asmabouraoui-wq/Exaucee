-- Run in Supabase SQL Editor

-- Back-in-stock notifications
create table if not exists restock_notifications (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  product_id  text not null,
  product_name text not null,
  email       text not null,
  notified_at timestamptz,
  unique(product_id, email)
);
alter table restock_notifications enable row level security;

-- Bundles
create table if not exists bundles (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  name           text not null,
  description    text default '',
  original_price numeric not null default 0,
  bundle_price   numeric not null default 0,
  image          text default '',
  items          jsonb not null default '[]',
  active         boolean default true,
  featured       boolean default false,
  sort_order     integer default 0
);
alter table bundles enable row level security;
create policy "bundles_public_read" on bundles for select using (active = true);

-- Referral codes
create table if not exists referral_codes (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  code           text not null unique,
  owner_email    text not null,
  owner_name     text default '',
  discount_type  text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value numeric not null default 10,
  uses_count     integer default 0,
  active         boolean default true
);
alter table referral_codes enable row level security;

-- Orders: gift wrap + referral columns
alter table orders add column if not exists gift_wrap        boolean default false;
alter table orders add column if not exists gift_wrap_fee    numeric default 0;
alter table orders add column if not exists referral_code    text;
alter table orders add column if not exists referral_discount numeric default 0;

-- Products: shades column  (array of {name, hex})
alter table products add column if not exists shades jsonb default '[]';
