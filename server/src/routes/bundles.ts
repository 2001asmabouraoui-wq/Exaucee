import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/bundles — public, active bundles
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) { res.status(500).json({ error: 'Failed to fetch bundles' }); return }
  res.json(data)
})

// GET /api/bundles/all — admin, all bundles
router.get('/all', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .order('sort_order')
  if (error) { res.status(500).json({ error: 'Failed to fetch bundles' }); return }
  res.json(data)
})

// POST /api/bundles — admin create
router.post('/', adminAuth, async (req, res) => {
  const { name, description, original_price, bundle_price, image, items, active, featured, sort_order } = req.body
  if (!name || bundle_price == null) {
    res.status(400).json({ error: 'name and bundle_price are required' }); return
  }
  const { data, error } = await supabase
    .from('bundles')
    .insert([{
      name, description: description ?? '',
      original_price: Number(original_price ?? 0),
      bundle_price: Number(bundle_price),
      image: image ?? '',
      items: items ?? [],
      active: active !== false,
      featured: !!featured,
      sort_order: sort_order ?? 0,
    }])
    .select()
    .single()
  if (error) { res.status(500).json({ error: 'Failed to create bundle' }); return }
  res.status(201).json(data)
})

// PATCH /api/bundles/:id — admin update
router.patch('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const updates = { ...req.body }
  if (updates.bundle_price != null) updates.bundle_price = Number(updates.bundle_price)
  if (updates.original_price != null) updates.original_price = Number(updates.original_price)
  const { data, error } = await supabase.from('bundles').update(updates).eq('id', id).select().single()
  if (error) { res.status(500).json({ error: 'Failed to update bundle' }); return }
  res.json(data)
})

// DELETE /api/bundles/:id — admin delete
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('bundles').delete().eq('id', id)
  if (error) { res.status(500).json({ error: 'Failed to delete bundle' }); return }
  res.json({ success: true })
})

export default router
