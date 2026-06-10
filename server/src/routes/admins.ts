import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/admins/check — public, JWT only: is the caller an admin?
router.get('/check', async (req, res) => {
  const token = req.headers['authorization']?.slice(7)
  if (!token) { res.json({ isAdmin: false }); return }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user?.email) { res.json({ isAdmin: false }); return }

    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
      .split(',').map(e => e.trim()).filter(Boolean)
    if (adminEmails.includes(user.email)) { res.json({ isAdmin: true }); return }

    const { data } = await supabase
      .from('admins').select('id').eq('email', user.email).maybeSingle()
    res.json({ isAdmin: !!data })
  } catch {
    res.json({ isAdmin: false })
  }
})

// GET /api/admins — list all extra admins (admin only)
router.get('/', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('admins')
    .select('id, created_at, email, label')
    .order('created_at')
  if (error) { res.status(500).json({ error: 'Failed to fetch admins' }); return }
  res.json(data ?? [])
})

// POST /api/admins — grant admin by email (admin only)
router.post('/', adminAuth, async (req, res) => {
  const { email, label } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }
  const { data, error } = await supabase
    .from('admins')
    .insert([{ email: email.toLowerCase().trim(), label: label?.trim() ?? email }])
    .select('id, created_at, email, label')
    .single()
  if (error) {
    const msg = error.code === '23505' ? 'This person is already an admin' : 'Failed to grant admin'
    res.status(error.code === '23505' ? 400 : 500).json({ error: msg })
    return
  }
  res.status(201).json(data)
})

// DELETE /api/admins/:id — revoke admin (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  const { error } = await supabase.from('admins').delete().eq('id', req.params.id)
  if (error) { res.status(500).json({ error: 'Failed to revoke admin' }); return }
  res.json({ success: true })
})

export default router
