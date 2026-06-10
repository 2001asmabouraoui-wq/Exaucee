-- Loyalty points transaction log
create table if not exists loyalty_points (
  id         uuid default gen_random_uuid() primary key,
  email      text not null,
  points     integer not null,
  type       text not null check (type in ('earn', 'redeem')),
  order_id   text,
  created_at timestamptz default now()
);
create index if not exists loyalty_points_email_idx on loyalty_points (lower(email));

-- RLS
alter table loyalty_points enable row level security;
create policy "service role full access" on loyalty_points
  using (true) with check (true);
