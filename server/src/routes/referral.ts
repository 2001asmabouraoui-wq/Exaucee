import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

function makeCode(name: string): string {
  const slug = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'EXC'
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${slug}${suffix}`
}

// GET /api/referral/validate/:code — public, validate a referral code
router.get('/validate/:code', async (req, res) => {
  const { code } = req.params
  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()

  if (error || !data) {
    res.json({ valid: false, message: 'Invalid or expired referral code.' }); return
  }

  res.json({
    valid: true,
    type: data.discount_type,
    discount_value: data.discount_value,
    message: `Referral code applied — ${data.discount_type === 'percent' ? data.discount_value + '%' : data.discount_value + ' TND'} off`,
  })
})

// POST /api/referral/use — record use when order is placed (called from orders route)
router.post('/use', async (req, res) => {
  const { code } = req.body
  if (!code) { res.status(400).json({ error: 'code required' }); return }

  const { error } = await supabase.rpc('increment_referral_uses', { ref_code: code.toUpperCase() })
  if (error) {
    // fallback: manual increment
    await supabase
      .from('referral_codes')
      .update({ uses_count: supabase.rpc('increment_referral_uses', { ref_code: code }) as any })
      .eq('code', code.toUpperCase())
  }
  res.json({ success: true })
})

// GET /api/referral — admin, list all codes
router.get('/', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { res.status(500).json({ error: 'Failed to fetch' }); return }
  res.json(data)
})

// POST /api/referral — admin, create referral code
router.post('/', adminAuth, async (req, res) => {
  const { owner_email, owner_name, discount_type, discount_value } = req.body
  if (!owner_email) { res.status(400).json({ error: 'owner_email required' }); return }

  const code = makeCode(owner_name || owner_email)
  const { data, error } = await supabase
    .from('referral_codes')
    .insert([{
      code,
      owner_email: owner_email.toLowerCase(),
      owner_name: owner_name ?? '',
      discount_type: discount_type ?? 'percent',
      discount_value: Number(discount_value ?? 10),
      active: true,
    }])
    .select()
    .single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /api/referral/:id — admin toggle active / change discount
router.patch('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('referral_codes')
    .update(req.body)
    .eq('id', id)
    .select()
    .single()
  if (error) { res.status(500).json({ error: 'Failed to update' }); return }
  res.json(data)
})

// DELETE /api/referral/:id — admin delete
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('referral_codes').delete().eq('id', id)
  if (error) { res.status(500).json({ error: 'Failed to delete' }); return }
  res.json({ success: true })
})

export default router
