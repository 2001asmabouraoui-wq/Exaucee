import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// POST /api/subscribers — public subscribe
router.post('/', async (req, res) => {
  const { email, name } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    res.status(400).json({ error: 'Valid email required' })
    return
  }
  const { data, error } = await supabase
    .from('subscribers')
    .upsert([{ email: email.toLowerCase().trim(), name: name ?? '' }], { onConflict: 'email' })
    .select()
    .single()
  if (error) { res.status(500).json({ error: 'Failed to subscribe' }); return }
  res.status(201).json({ success: true, id: data.id })
})

// GET /api/subscribers (admin)
router.get('/', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })
  if (error) { res.status(500).json({ error: 'Failed to fetch subscribers' }); return }
  res.json(data)
})

// DELETE /api/subscribers/:id (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  const { error } = await supabase.from('subscribers').delete().eq('id', req.params.id)
  if (error) { res.status(500).json({ error: 'Failed to delete subscriber' }); return }
  res.json({ success: true })
})

export default router
