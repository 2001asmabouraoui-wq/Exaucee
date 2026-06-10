-- Run this in Supabase → SQL Editor

create table if not exists orders (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),

  -- Customer
  name        text        not null,
  email       text        not null,
  phone       text,

  -- Shipping
  address     text        not null,
  zip         text        not null,
  city        text        not null,
  country     text        not null default 'Tunisia',

  -- Order details
  payment_method  text    not null default 'electronic',
  comment         text,
  items           jsonb   not null,

  -- Totals (TND)
  subtotal    numeric     not null,
  shipping    numeric     not null,
  total       numeric     not null,

  -- Status
  status      text        not null default 'pending'
    check (status in ('pending','processing','shipped','delivered','cancelled'))
);

-- Index for fast ordering
create index if not exists orders_created_at_idx on orders(created_at desc);

-- Disable public access; server uses service role key which bypasses RLS
alter table orders enable row level security;
