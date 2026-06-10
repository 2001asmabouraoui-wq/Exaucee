-- ══════════════════════════════════════════════════════════
--  Exaucée — schema v3
--  Run this in Supabase → SQL Editor
--  (safe to run even if you already ran v2 — uses IF NOT EXISTS
--   and ALTER … IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ══════════════════════════════════════════════════════════

-- ── Products ─────────────────────────────────────────────
create table if not exists products (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  name        text        not null,
  subheader   text        not null default '',
  category    text        not null,
  price       numeric     not null,
  final_price numeric,
  description text        default '',
  features    text        default '',
  src         text        default '',
  nu          boolean     default false,
  in_stock    boolean     default true,
  featured    boolean     default false,
  sort_order  integer     default 0
);

alter table products enable row level security;
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products for select using (true);

-- ── Subscribers ──────────────────────────────────────────
create table if not exists subscribers (
  id                uuid        default gen_random_uuid() primary key,
  subscribed_at     timestamptz default now(),
  email             text        not null unique,
  name              text        default '',
  prize             text        default '',
  coupon_code       text,
  coupon_expires_at timestamptz
);

alter table subscribers enable row level security;

-- Add coupon columns if this table already existed without them
alter table subscribers add column if not exists coupon_code text;
alter table subscribers add column if not exists coupon_expires_at timestamptz;

-- ── Admins (email-based — no secret column) ───────────────
create table if not exists admins (
  id         uuid        default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  email      text        not null unique,
  label      text        default ''
);

alter table admins enable row level security;

-- ── Seed 9 products ───────────────────────────────────────
insert into products (name, subheader, category, price, final_price, description, features, src, nu, in_stock, featured, sort_order) values
('Cupcake',       'Blush',     'blush',    28, null,
 'A warm rose blush that melts onto the cheeks like the softest frosting. Buildable, weightless, utterly wearable.',
 'Long-wearing formula · Finely-milled pigment · Cruelty-free · Dermatologist tested',
 '/products/blush/Gemini_Generated_Image_-removebg-preview.png', true,  true, true,  0),

('Cupcake Rose',  'Blush',     'blush',    28, null,
 'A bold raspberry blush as vivid and joyful as a rose-frosted cupcake fresh from a Parisian window.',
 'Long-wearing formula · Finely-milled pigment · Cruelty-free · Dermatologist tested',
 '/products/blush/Gemini_Generated_Image_-removebg-preview.png', true,  true, false, 1),

('Cupcake Doré',  'Blush',     'blush',    30, null,
 'A sun-kissed nude blush with warm golden undertones — like the glimmer of a gilded cupcake in afternoon light.',
 'Long-wearing formula · Finely-milled pigment · Cruelty-free · Dermatologist tested',
 '/products/blush/Gemini_Generated_Image_-removebg-preview.png', false, true, false, 2),

('Éclair',        'Lip Gloss', 'lipgloss', 22, null,
 'A sheer ballet-pink gloss that coats lips in a veil of sweetness. Non-sticky, plumping, with a faint vanilla-rose scent.',
 'High-shine formula · Plumping peptides · Non-sticky · Cruelty-free',
 '/products/lipgloss/Gemini_Generated_Image___1_-removebg-preview.png', true,  true, true,  0),

('Éclair Pêche',  'Lip Gloss', 'lipgloss', 22, null,
 'A peachy-nude gloss warm as caramel on choux pastry — creamy, luminous, endlessly wearable.',
 'High-shine formula · Plumping peptides · Non-sticky · Cruelty-free',
 '/products/lipgloss/Gemini_Generated_Image___1_-removebg-preview.png', true,  true, false, 1),

('Éclair Vanille', 'Lip Gloss','lipgloss', 20, null,
 'A barely-there gloss with a lilac-clear tint — like a puff of crème chantilly. Luminous and effortlessly dreamy.',
 'High-shine formula · Plumping peptides · Non-sticky · Cruelty-free',
 '/products/lipgloss/Gemini_Generated_Image___1_-removebg-preview.png', false, true, false, 2),

('Macaron',       'Lip Liner', 'lipliner', 18, null,
 'A dusty rose liner that defines and perfects. Creamy yet precise, it glides like silk and lasts all day.',
 'Creamy formula · Smudge-proof · Cruelty-free · Dermatologist tested',
 '/products/lipliner/Gemini_Generated_Image___2_-removebg-preview.png', true,  true, true,  0),

('Macaron Mauve', 'Lip Liner', 'lipliner', 18, null,
 'A deep mauve liner as rich and velvety as a dark chocolate macaron. For an editorial lip with effortless depth.',
 'Creamy formula · Smudge-proof · Cruelty-free · Dermatologist tested',
 '/products/lipliner/Gemini_Generated_Image___2_-removebg-preview.png', false, true, false, 1),

('Macaron Nude',  'Lip Liner', 'lipliner', 16, null,
 'A soft nude liner that works with every look — your lips, but perfected. The your-lips-but-better macaron shade.',
 'Creamy formula · Smudge-proof · Cruelty-free · Dermatologist tested',
 '/products/lipliner/Gemini_Generated_Image___2_-removebg-preview.png', false, true, false, 2)
on conflict do nothing;
