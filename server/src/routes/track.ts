import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// GET /api/track?email=&order_id= — public, track own orders
router.get('/', async (req, res) => {
  const { email, order_id } = req.query as Record<string, string>

  if (!email && !order_id) {
    res.status(400).json({ error: 'Provide email or order_id' }); return
  }

  let query = supabase
    .from('orders')
    .select('id, created_at, name, email, status, total, items, gift_wrap, shipping, city, payment_method')
    .order('created_at', { ascending: false })
    .limit(10)

  if (order_id) {
    query = query.eq('id', order_id)
  } else {
    query = query.ilike('email', email.trim())
  }

  const { data, error } = await query
  if (error) { res.status(500).json({ error: 'Failed to fetch orders' }); return }
  if (!data?.length) { res.status(404).json({ error: 'No orders found' }); return }
  res.json(data)
})

export default router
