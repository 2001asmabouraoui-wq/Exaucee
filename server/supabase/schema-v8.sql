-- ══════════════════════════════════════════════════════════
--  Exaucée — schema v8
--  Product catalog overhaul: lip gloss only, 3 real variants
--  Run this in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

-- ── 1. Remove all old products ────────────────────────────
delete from products;

-- ── 2. Insert the 3 real lip gloss variants ───────────────
insert into products
  (name, subheader, category, price, final_price, description, features, src, nu, in_stock, featured, sort_order, quantity, shades, sale_start, sale_end)
values

('Chantilly',
 'Gloss Repulpant Transparent',
 'lipgloss',
 25, null,
 'Un gloss repulpant transparent au bouchon dôme cristal. Non-collant, ultra-brillant, légèrement parfumé à la vanille rose.',
 'Formule repulpante · Brillance intense · Non-collant · Cruelty-free · Testé dermatologiquement',
 '/products/lipgloss/gloss-transparent.png',
 true, true, true, 0, null, '[]', null, null),

('Framboise',
 'Gloss Rose Cerise',
 'lipgloss',
 25, null,
 'Un gloss rose cerise profond aussi intense qu''une tarte aux cerises fraîchement sortie du four. Pigmenté, brillant, irrésistible.',
 'Formule repulpante · Brillance intense · Non-collant · Cruelty-free · Testé dermatologiquement',
 '/products/lipgloss/gloss-cerise.png',
 true, true, false, 1, null, '[]', null, null),

('Caramel',
 'Gloss Brun Doré',
 'lipgloss',
 25, null,
 'Un gloss brun doré chaud comme le caramel coulant sur une crêpe dorée. Lumineux, doux et délicieusement addictif.',
 'Formule repulpante · Brillance intense · Non-collant · Cruelty-free · Testé dermatologiquement',
 '/products/lipgloss/gloss-miel.png',
 true, true, false, 2, null, '[]', null, null);

-- ── 3. Update the announcement banner ─────────────────────
insert into settings (key, value)
values ('announcement', '🎀 Livraison gratuite dès 100 TND  ✦  ✨ Nouveauté — Gloss Chantilly  ✦  🌸 Cruelty-free & Testé dermatologiquement  ✦  💝 Code EXAUCEE10 pour −10%')
on conflict (key) do update set value = excluded.value, updated_at = now();
