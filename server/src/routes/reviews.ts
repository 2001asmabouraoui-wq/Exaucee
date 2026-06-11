import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/reviews?product_id=... — public, approved only
router.get('/', async (req, res) => {
  const { product_id } = req.query

  if (!product_id) {
    res.status(400).json({ error: 'product_id query parameter is required.' })
    return
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', product_id as string)
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) { res.status(500).json({ error: 'Failed to fetch reviews' }); return }
  res.json(data)
})

// POST /api/reviews — public, submitted for approval
router.post('/', async (req, res) => {
  const { product_id, name, email, rating, comment, image_url } = req.body

  if (!product_id || !name || !email || rating === undefined || comment === undefined) {
    res.status(400).json({ error: 'All fields (product_id, name, email, rating, comment) are required.' })
    return
  }

  const ratingNum = Number(rating)
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' })
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'A valid email address is required.' })
    return
  }

  const { error } = await supabase
    .from('reviews')
    .insert([{ product_id, name, email, rating: ratingNum, comment, approved: true, image_url: image_url || null }])

  if (error) { res.status(500).json({ error: 'Failed to submit review' }); return }
  res.status(201).json({ success: true, message: 'Review submitted for approval.' })
})

// GET /api/reviews/all — admin, all reviews
router.get('/all', adminAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { res.status(500).json({ error: 'Failed to fetch reviews' }); return }
  res.json(data)
})

// PATCH /api/reviews/:id — admin
router.patch('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { approved } = req.body

  const { data, error } = await supabase
    .from('reviews')
    .update({ approved })
    .eq('id', id)
    .select()
    .single()

  if (error) { res.status(500).json({ error: 'Failed to update review' }); return }
  res.json(data)
})

// DELETE /api/reviews/:id — admin
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) { res.status(500).json({ error: 'Failed to delete review' }); return }
  res.json({ success: true })
})

export default router
