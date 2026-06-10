import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// ── Helpers: retry INSERT/UPDATE by stripping columns that don't exist yet ──
async function tryInsert(data: Record<string, any>): Promise<{ data: any; error: any }> {
  const result = await supabase.from('products').insert([data]).select().single()
  if (!result.error) return result
  const msg = result.error.message ?? ''
  const col = extractMissingCol(msg)
  if (col) {
    const retry = { ...data }
    delete retry[col]
    return tryInsert(retry)
  }
  return result
}

async function tryUpdate(id: string, data: Record<string, any>): Promise<{ data: any; error: any }> {
  const result = await supabase.from('products').update(data).eq('id', id).select().single()
  if (!result.error) return result
  const msg = result.error.message ?? ''
  const col = extractMissingCol(msg)
  if (col) {
    const retry = { ...data }
    delete retry[col]
    return tryUpdate(id, retry)
  }
  return result
}

function extractMissingCol(msg: string): string | null {
  const lower = msg.toLowerCase()

  // PostgreSQL: column "alt_src" of relation "products" does not exist
  if (lower.includes('does not exist')) {
    const m = msg.match(/column "([^"]+)"/)
    if (m) return m[1]
  }

  // PostgREST schema cache errors (single-quoted column names):
  // "Could not find the 'alt_src' column of 'products' in the schema cache"
  // "could not find column 'alt_src' of 'products' in the schema cache"
  if (lower.includes('schema cache') || lower.includes('could not find')) {
    const m =
      msg.match(/'([^']+)' column/) ||   // 'col' column
      msg.match(/column '([^']+)'/) ||   // column 'col'
      msg.match(/find (?:the )?'([^']+)'/) // find 'col'
    if (m) return m[1]
  }

  return null
}

// GET /api/products — public, in-stock products only
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('category')
    .order('sort_order')
  if (error) { res.status(500).json({ error: 'Failed to fetch products' }); return }

  const now = new Date().toISOString()
  const processed = (data ?? []).map((p: any) => {
    if (p.final_price != null && (p.sale_start || p.sale_end)) {
      const started  = !p.sale_start || now >= p.sale_start
      const notEnded = !p.sale_end   || now <= p.sale_end
      if (!started || !notEnded) return { ...p, final_price: null }
    }
    return p
  })
  res.json(processed)
})

// GET /api/products/migration-status — which optional columns are missing
router.get('/migration-status', adminAuth, async (_req, res) => {
  const optional = ['alt_src', 'quantity', 'shades', 'sale_start', 'sale_end']
  const missing: string[] = []
  for (const col of optional) {
    const { error } = await supabase.from('products').select(col).limit(1)
    if (error && (error.message.includes('schema cache') || error.message.includes('does not exist'))) {
      missing.push(col)
    }
  }
  res.json({ ok: missing.length === 0, missingColumns: missing })
})

// GET /api/products/all — admin, all products including out-of-stock — before /:id
router.get('/all', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('category')
    .order('sort_order')
  if (error) { res.status(500).json({ error: 'Failed to fetch products' }); return }
  res.json(data)
})

// POST /api/products (admin)
router.post('/', adminAuth, async (req, res) => {
  const {
    name, subheader, category, price, final_price,
    description, features, src, alt_src,
    nu, in_stock, featured, sort_order,
    quantity, shades, sale_start, sale_end, packaging,
  } = req.body

  if (!name || !category || price == null) {
    res.status(400).json({ error: 'name, category, price are required' })
    return
  }

  const payload: Record<string, any> = {
    name,
    subheader:   subheader   ?? '',
    category,
    price:       Number(price),
    final_price: final_price != null ? Number(final_price) : null,
    description: description ?? '',
    features:    features    ?? '',
    src:         src         ?? '',
    alt_src:     alt_src     || null,
    nu:          !!nu,
    in_stock:    in_stock !== false,
    featured:    !!featured,
    sort_order:  sort_order  ?? 0,
    quantity:    quantity    != null ? Number(quantity) : null,
    shades:      shades      ?? [],
    sale_start:  sale_start  || null,
    sale_end:    sale_end    || null,
    packaging:   packaging   || 'optional',
  }

  const { data, error } = await tryInsert(payload)
  if (error) {
    res.status(500).json({ error: error.message || 'Failed to create product' })
    return
  }
  res.status(201).json(data)
})

// PATCH /api/products/:id (admin)
router.patch('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const updates: Record<string, any> = { ...req.body }
  if (updates.price       != null) updates.price       = Number(updates.price)
  if (updates.final_price != null) updates.final_price = Number(updates.final_price)

  const { data, error } = await tryUpdate(id, updates)
  if (error) {
    res.status(500).json({ error: error.message || 'Failed to update product' })
    return
  }
  res.json(data)
})

// DELETE /api/products/:id (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) { res.status(500).json({ error: 'Failed to delete product' }); return }
  res.json({ success: true })
})

export default router
