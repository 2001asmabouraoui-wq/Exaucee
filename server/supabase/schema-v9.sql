-- ══════════════════════════════════════════════════════════
--  Exaucée — schema v9
--  Safety migration: ensures all product columns exist,
--  then re-seeds the 3 lip gloss variants with correct data.
--  Run in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

-- ── 1. Ensure all product columns exist ──────────────────
alter table products add column if not exists quantity   integer;
alter table products add column if not exists shades     jsonb default '[]';
alter table products add column if not exists sale_start timestamptz;
alter table products add column if not exists sale_end   timestamptz;
alter table products add column if not exists alt_src    text;

-- ── 2. Ensure review image column exists ─────────────────
alter table reviews add column if not exists image_url text;

-- ── 3. Ensure settings table exists ──────────────────────
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

-- ── 4. Re-seed the 3 correct lip gloss products ──────────
--    (removes old data, inserts clean records)
delete from products;

insert into products
  (name, subheader, category, price, final_price, description, features, src, alt_src, nu, in_stock, featured, sort_order, quantity, shades, sale_start, sale_end)
values

('Chantilly',
 'Gloss Repulpant Transparent',
 'lipgloss',
 25, null,
 'Un gloss repulpant transparent au bouchon dôme cristal. Non-collant, ultra-brillant, légèrement parfumé à la vanille rose.',
 'Formule repulpante · Brillance intense · Non-collant · Cruelty-free · Testé dermatologiquement',
 '/products/lipgloss/gloss-transparent.png',
 '/products/lipgloss/lifestyle-1.jpg',
 true, true, true, 0, null, '[]', null, null),

('Framboise',
 'Gloss Rose Cerise',
 'lipgloss',
 25, null,
 'Un gloss rose cerise profond aussi intense qu''une tarte aux cerises fraîchement sortie du four. Pigmenté, brillant, irrésistible.',
 'Formule repulpante · Brillance intense · Non-collant · Cruelty-free · Testé dermatologiquement',
 '/products/lipgloss/gloss-cerise.png',
 '/products/lipgloss/lifestyle-2.jpg',
 true, true, false, 1, null, '[]', null, null),

('Caramel',
 'Gloss Brun Doré',
 'lipgloss',
 25, null,
 'Un gloss brun doré chaud comme le caramel coulant sur une crêpe dorée. Lumineux, doux et délicieusement addictif.',
 'Formule repulpante · Brillance intense · Non-collant · Cruelty-free · Testé dermatologiquement',
 '/products/lipgloss/gloss-miel.png',
 '/products/lipgloss/lifestyle-3.jpg',
 true, true, false, 2, null, '[]', null, null);

-- ── 5. Storage bucket for product images ─────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public read
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Allow service role full access (server uses service key)
create policy "product_images_service_write" on storage.objects
  for insert with check (bucket_id = 'product-images');

-- ── 6. Update announcement banner ────────────────────────
insert into settings (key, value)
values ('announcement', '🎀 Livraison gratuite dès 100 TND  ✦  ✨ Nouveauté — Gloss Chantilly  ✦  🌸 Cruelty-free & Testé dermatologiquement  ✦  💝 Code EXAUCEE10 pour −10%')
on conflict (key) do update set value = excluded.value, updated_at = now();
