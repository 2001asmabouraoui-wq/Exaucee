import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// POST /api/upload/avatar — JWT-authenticated, uploads via service key (bypasses RLS)
router.post('/avatar', async (req, res) => {
  const token = req.headers['authorization']?.slice(7)
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { base64, contentType, ext } = req.body
  if (!base64 || !contentType) { res.status(400).json({ error: 'base64 and contentType required' }); return }

  const buffer = Buffer.from(base64, 'base64')
  const path   = `${user.id}.${ext ?? 'jpg'}`

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, { contentType, upsert: true })

  if (upErr) { res.status(500).json({ error: upErr.message }); return }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  res.json({ url: urlData.publicUrl })
})

// POST /api/upload/product-image — admin only
router.post('/product-image', async (req, res) => {
  const token = req.headers['authorization']?.slice(7)
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user?.email) { res.status(401).json({ error: 'Unauthorized' }); return }

  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',').map(e => e.trim()).filter(Boolean)
  if (!adminEmails.includes(user.email)) { res.status(403).json({ error: 'Not admin' }); return }

  const { base64, contentType, ext } = req.body
  if (!base64 || !contentType) { res.status(400).json({ error: 'base64 and contentType required' }); return }

  // Auto-create the bucket on first use (no-op if it already exists)
  await supabase.storage.createBucket('product-images', { public: true }).catch(() => {})

  const buffer = Buffer.from(base64, 'base64')
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext ?? 'jpg'}`

  const { error: upErr } = await supabase.storage
    .from('product-images')
    .upload(path, buffer, { contentType, upsert: false })

  if (upErr) { res.status(500).json({ error: upErr.message }); return }

  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
  res.json({ url: urlData.publicUrl })
})

// POST /api/upload/review-image — no auth (public reviews)
router.post('/review-image', async (req, res) => {
  const { base64, contentType, ext } = req.body
  if (!base64 || !contentType) { res.status(400).json({ error: 'base64 and contentType required' }); return }
  const buffer = Buffer.from(base64, 'base64')
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext ?? 'jpg'}`
  const { error: upErr } = await supabase.storage
    .from('review-images')
    .upload(path, buffer, { contentType, upsert: false })
  if (upErr) { res.status(500).json({ error: upErr.message }); return }
  const { data: urlData } = supabase.storage.from('review-images').getPublicUrl(path)
  res.json({ url: urlData.publicUrl })
})

export default router
