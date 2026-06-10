-- v7: scheduled sales, review images, settings table

-- Scheduled sale columns on products
alter table products add column if not exists sale_start timestamptz;
alter table products add column if not exists sale_end   timestamptz;

-- Review photo support
alter table reviews add column if not exists image_url text;

-- Site settings key-value store
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

-- Default announcement text (no-op if already present)
insert into settings (key, value)
values ('announcement', '✦ Free shipping on orders over 150 TND · New collection available now ✦')
on conflict (key) do nothing;

-- Review-images storage bucket (run once in Supabase dashboard if not exists)
-- insert into storage.buckets (id, name, public) values ('review-images', 'review-images', true) on conflict do nothing;
