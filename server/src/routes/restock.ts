import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'
import { sendRestockNotification } from '../lib/mailer.js'

const router = Router()

// POST /api/restock-notify — public, subscribe to a product restock
router.post('/', async (req, res) => {
  const { product_id, product_name, email } = req.body
  if (!product_id || !email) {
    res.status(400).json({ error: 'product_id and email are required' }); return
  }
  const { error } = await supabase
    .from('restock_notifications')
    .upsert([{ product_id, product_name: product_name ?? product_id, email }], {
      onConflict: 'product_id,email',
      ignoreDuplicates: true,
    })
  if (error) { res.status(500).json({ error: 'Failed to save notification' }); return }
  res.json({ success: true })
})

// GET /api/restock-notify — admin, list all pending notifications
router.get('/', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('restock_notifications')
    .select('*')
    .is('notified_at', null)
    .order('created_at', { ascending: false })
  if (error) { res.status(500).json({ error: 'Failed to fetch' }); return }
  res.json(data)
})

// POST /api/restock-notify/trigger/:product_id — admin, send emails for a product
router.post('/trigger/:product_id', adminAuth, async (req, res) => {
  const { product_id } = req.params

  const { data: notifications, error } = await supabase
    .from('restock_notifications')
    .select('*')
    .eq('product_id', product_id)
    .is('notified_at', null)

  if (error || !notifications?.length) {
    res.json({ sent: 0 }); return
  }

  const productName = notifications[0].product_name
  let sent = 0
  for (const n of notifications) {
    try {
      await sendRestockNotification(n.email, productName)
      sent++
    } catch { /* non-critical */ }
  }

  await supabase
    .from('restock_notifications')
    .update({ notified_at: new Date().toISOString() })
    .eq('product_id', product_id)
    .is('notified_at', null)

  res.json({ sent })
})

export default router
