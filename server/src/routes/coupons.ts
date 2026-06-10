import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// POST /api/coupons/validate — public
router.post('/validate', async (req, res) => {
  const { code, cart_total } = req.body

  if (!code || cart_total === undefined) {
    res.status(400).json({ valid: false, message: 'Code and cart_total are required.' })
    return
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', code)
    .single()

  if (error || !coupon) {
    // fallback: check referral_codes table
    const { data: ref } = await supabase
      .from('referral_codes')
      .select('*')
      .ilike('code', code)
      .eq('active', true)
      .single()

    if (!ref) {
      res.json({ valid: false, message: 'Invalid code.' })
      return
    }

    let refDiscount = 0
    if (ref.discount_type === 'percent') {
      refDiscount = Number(cart_total) * Number(ref.discount_value) / 100
    } else {
      refDiscount = Math.min(Number(ref.discount_value), Number(cart_total))
    }
    // Increment use count
    await supabase.from('referral_codes')
      .update({ uses_count: ref.uses_count + 1 })
      .eq('id', ref.id)

    res.json({
      valid: true,
      type: ref.discount_type === 'percent' ? 'percent' : 'fixed',
      value: ref.discount_value,
      discount_amount: Number(refDiscount.toFixed(2)),
      message: `Referral code applied — ${ref.discount_type === 'percent' ? ref.discount_value + '% off' : ref.discount_value + ' TND off'}`,
      is_referral: true,
    })
    return
  }

  if (!coupon.active) {
    res.json({ valid: false, message: 'This coupon is no longer active.' })
    return
  }

  if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
    res.json({ valid: false, message: 'This coupon has expired.' })
    return
  }

  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    res.json({ valid: false, message: 'This coupon has reached its usage limit.' })
    return
  }

  if (coupon.min_purchase && Number(cart_total) < Number(coupon.min_purchase)) {
    res.json({
      valid: false,
      message: `A minimum purchase of ${coupon.min_purchase} TND is required for this coupon.`,
    })
    return
  }

  let discount_amount = 0
  if (coupon.type === 'percent') {
    discount_amount = Number(cart_total) * Number(coupon.value) / 100
  } else if (coupon.type === 'fixed') {
    discount_amount = Math.min(Number(coupon.value), Number(cart_total))
  } else if (coupon.type === 'free_shipping') {
    discount_amount = 0
  }

  res.json({
    valid: true,
    type: coupon.type,
    value: coupon.value,
    discount_amount: Number(discount_amount.toFixed(2)),
    min_purchase: coupon.min_purchase,
    message: 'Coupon applied!',
  })
})

// GET /api/coupons — admin
router.get('/', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { res.status(500).json({ error: 'Failed to fetch coupons' }); return }
  res.json(data)
})

// POST /api/coupons — admin
router.post('/', adminAuth, async (req, res) => {
  const { code, type, value, min_purchase, max_uses, expires_at, active } = req.body

  if (!code) {
    res.status(400).json({ error: 'Coupon code is required.' })
    return
  }

  if (!['percent', 'fixed', 'free_shipping'].includes(type)) {
    res.status(400).json({ error: "Type must be 'percent', 'fixed', or 'free_shipping'." })
    return
  }

  if (value === undefined || Number(value) < 0) {
    res.status(400).json({ error: 'Value must be 0 or greater.' })
    return
  }

  const { data, error } = await supabase
    .from('coupons')
    .insert([{ code, type, value, min_purchase, max_uses, expires_at, active: active ?? true }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'A coupon with this code already exists.' })
    } else {
      res.status(500).json({ error: 'Failed to create coupon' })
    }
    return
  }

  res.status(201).json(data)
})

// PATCH /api/coupons/:id — admin
router.patch('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { active } = req.body

  const { data, error } = await supabase
    .from('coupons')
    .update({ active })
    .eq('id', id)
    .select()
    .single()

  if (error) { res.status(500).json({ error: 'Failed to update coupon' }); return }
  res.json(data)
})

// DELETE /api/coupons/:id — admin
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) { res.status(500).json({ error: 'Failed to delete coupon' }); return }
  res.json({ success: true })
})

export default router
