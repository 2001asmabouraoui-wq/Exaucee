import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/loyalty/balance?email=... — public (checkout balance check)
router.get('/balance', async (req, res) => {
  const email = String(req.query.email || '').toLowerCase().trim()
  if (!email) { res.status(400).json({ error: 'email required' }); return }

  const { data, error } = await supabase
    .from('loyalty_points')
    .select('points')
    .ilike('email', email)

  if (error) { res.status(500).json({ error: 'Failed to fetch balance' }); return }
  const balance = Math.max(0, (data ?? []).reduce((s, r) => s + r.points, 0))
  res.json({ email, balance })
})

// GET /api/loyalty/all — admin: full transaction log
router.get('/all', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) { res.status(500).json({ error: 'Failed to fetch' }); return }
  res.json(data)
})

export default router
