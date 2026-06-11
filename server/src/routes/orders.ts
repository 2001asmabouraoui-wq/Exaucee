import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { sendOrderNotification, sendLowStockAlert } from '../lib/mailer.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/orders/top-products?days=30 — admin
router.get('/top-products', adminAuth, async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90)
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data, error } = await supabase
    .from('orders')
    .select('items')
    .gte('created_at', since)
    .neq('status', 'cancelled')

  if (error) { res.status(500).json({ error: 'Failed to fetch' }); return }

  const map: Record<string, { name: string; category: string; total_sold: number; revenue: number }> = {}
  for (const order of data ?? []) {
    for (const item of (order.items ?? [])) {
      const key = item.name
      if (!map[key]) map[key] = { name: item.name, category: item.category || '', total_sold: 0, revenue: 0 }
      map[key].total_sold += Number(item.quantity) || 1
      map[key].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1)
    }
  }

  res.json(
    Object.values(map)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 10)
      .map(p => ({ ...p, revenue: Number(p.revenue.toFixed(2)) }))
  )
})

// POST /api/orders — create new order (public)
router.post('/', async (req, res) => {
  const { name, email, phone, address, zip, city, country, payment_method, comment, items, subtotal, shipping, total, coupon_code, discount, loyalty_points_redeemed } = req.body

  if (!name || !email || !address || !zip || !city || !country || !items?.length) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  // Try inserting with optional columns; retry stripping any that don't exist yet
  async function tryInsertOrder(row: Record<string, unknown>): Promise<{ data: any; error: any }> {
    const result = await supabase.from('orders').insert([row]).select().single()
    if (!result.error) return result
    const msg = (result.error.message ?? '').toLowerCase()
    const col = msg.match(/column "([^"]+)"/)
      || msg.match(/'([^']+)' column/)
      || msg.match(/column '([^']+)'/)
    if (col && (msg.includes('does not exist') || msg.includes('schema cache'))) {
      const retry = { ...row }
      delete retry[col[1]]
      return tryInsertOrder(retry)
    }
    return result
  }

  const { data, error } = await tryInsertOrder({
    name, email, phone, address, zip, city, country,
    payment_method, comment, items, subtotal, shipping, total,
    status: 'pending',
    coupon_code: coupon_code || null,
    discount: discount || 0,
  })

  if (error) {
    console.error('Supabase insert error:', error)
    res.status(500).json({ error: 'Failed to save order' })
    return
  }

  sendOrderNotification(data).catch(err => console.error('Email failed:', err))

  // Earn loyalty points + deduct redeemed: fire-and-forget
  ;(async () => {
    const pts = Math.floor(Number(total))
    if (pts > 0 && email) {
      try {
        await supabase.from('loyalty_points').insert([{
          email: String(email).toLowerCase(),
          points: pts,
          type: 'earn',
          order_id: data.id,
        }])
      } catch { /* fire-and-forget */ }
    }
    if (loyalty_points_redeemed && Number(loyalty_points_redeemed) > 0) {
      try {
        await supabase.from('loyalty_points').insert([{
          email: String(email).toLowerCase(),
          points: -Number(loyalty_points_redeemed),
          type: 'redeem',
          order_id: data.id,
        }])
      } catch { /* fire-and-forget */ }
    }
  })()

  // Decrement stock and send low-stock alerts: fire-and-forget
  ;(async () => {
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('id, name, quantity')
        .ilike('name', item.name)
        .limit(1)
        .single()

      if (product && product.quantity != null) {
        const newQty = Math.max(0, product.quantity - item.quantity)
        const updates: Record<string, unknown> = { quantity: newQty }
        if (newQty === 0) updates.in_stock = false

        await supabase.from('products').update(updates).eq('id', product.id)

        if (newQty < 5) {
          sendLowStockAlert(item.name, newQty).catch(err =>
            console.error('Low-stock alert failed:', err)
          )
        }
      }
    }
  })()

  res.status(201).json({ success: true, orderId: data.id })
})

// GET /api/orders/my — orders for the authenticated user (requires Supabase JWT)
router.get('/my', async (req, res) => {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' }); return
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user?.email) {
    res.status(401).json({ error: 'Invalid token' }); return
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .ilike('email', user.email)
    .order('created_at', { ascending: false })

  console.log('[orders/my] email:', user.email, '| found:', data?.length ?? 0, '| error:', error?.message)
  if (error) { res.status(500).json({ error: 'Failed to fetch orders' }); return }
  res.json(data)
})

// GET /api/orders/revenue-chart?days=30 — admin, daily revenue for chart
router.get('/revenue-chart', adminAuth, async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90)
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total, status')
    .gte('created_at', since)
    .neq('status', 'cancelled')
    .order('created_at')

  if (error) { res.status(500).json({ error: 'Failed to fetch' }); return }

  const map: Record<string, { revenue: number; orders: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    map[d] = { revenue: 0, orders: 0 }
  }
  for (const o of data ?? []) {
    const d = o.created_at.slice(0, 10)
    if (map[d]) { map[d].revenue += Number(o.total); map[d].orders++ }
  }
  res.json(Object.entries(map).map(([date, v]) => ({ date, ...v })))
})

// GET /api/orders/stats — aggregate stats (admin) — must be before /:id
router.get('/stats', adminAuth, async (_req, res) => {
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('total, status, created_at')

  const { count: subscriberCount } = await supabase
    .from('subscribers')
    .select('id', { count: 'exact', head: true })

  if (ordersErr) { res.status(500).json({ error: 'Failed to fetch stats' }); return }

  const today = new Date().toISOString().slice(0, 10)
  const counts: Record<string, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
  let revenue = 0
  let todayOrders = 0

  for (const o of orders ?? []) {
    counts[o.status] = (counts[o.status] ?? 0) + 1
    if (o.status !== 'cancelled') revenue += Number(o.total)
    if (o.created_at.slice(0, 10) === today) todayOrders++
  }

  res.json({
    total_orders: orders?.length ?? 0,
    total_revenue: revenue.toFixed(2),
    today_orders: todayOrders,
    status_counts: counts,
    subscribers: subscriberCount ?? 0,
  })
})

// GET /api/orders — list with optional ?status= and ?search= (admin)
router.get('/', adminAuth, async (req, res) => {
  const { status, search } = req.query

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status as string)
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) { res.status(500).json({ error: 'Failed to fetch orders' }); return }
  res.json(data)
})

// PATCH /api/orders/:id — update status (admin)
router.patch('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  if (!allowed.includes(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) { res.status(500).json({ error: 'Failed to update order' }); return }
  res.json(data)
})

// DELETE /api/orders/:id (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) { res.status(500).json({ error: 'Failed to delete order' }); return }
  res.json({ success: true })
})

export default router
