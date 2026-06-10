import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// Helper: extract and verify Supabase JWT
async function getAuthUser(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/wishlist — get wishlist product_ids for authenticated user
router.get('/', async (req, res) => {
  const user = await getAuthUser(req.headers['authorization'])
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { data, error } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user.id)

  if (error) { res.status(500).json({ error: 'Failed to fetch wishlist' }); return }
  res.json((data ?? []).map((row: { product_id: string }) => row.product_id))
})

// POST /api/wishlist — add product to wishlist
router.post('/', async (req, res) => {
  const user = await getAuthUser(req.headers['authorization'])
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { product_id } = req.body
  if (!product_id) { res.status(400).json({ error: 'product_id is required.' }); return }

  const { error } = await supabase
    .from('wishlists')
    .upsert([{ user_id: user.id, product_id }], { onConflict: 'user_id,product_id' })

  if (error) { res.status(500).json({ error: 'Failed to add to wishlist' }); return }
  res.json({ success: true })
})

// DELETE /api/wishlist/:product_id — remove product from wishlist
router.delete('/:product_id', async (req, res) => {
  const user = await getAuthUser(req.headers['authorization'])
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { product_id } = req.params

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', product_id)

  if (error) { res.status(500).json({ error: 'Failed to remove from wishlist' }); return }
  res.json({ success: true })
})

export default router
