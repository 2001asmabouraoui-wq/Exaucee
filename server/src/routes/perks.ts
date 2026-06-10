import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()
const KEY = 'perks'

const DEFAULTS = [
  { id: 1, threshold: 50,  topText: 'Dès 50 TND',  subText: 'Pochette ruban offerte',  giftName: 'Pochette Ruban Exaucée', emoji: '🎀', active: true },
  { id: 2, threshold: 100, topText: 'Dès 100 TND', subText: 'Gloss offert',             giftName: 'Gloss Exaucée',          emoji: '✨', active: true },
  { id: 3, threshold: 150, topText: 'Dès 150 TND', subText: 'Coffret cadeau offert',    giftName: 'Coffret Cadeau Exaucée', emoji: '🌸', active: true },
  { id: 4, threshold: 0,   topText: 'Toujours',    subText: 'Cruelty-free & vegan',     giftName: '',                       emoji: '🐰', active: true },
]

// GET /api/perks — public
router.get('/', async (_req, res) => {
  const { data } = await supabase.from('settings').select('value').eq('key', KEY).single()
  if (data?.value) {
    try { res.json(JSON.parse(data.value)); return } catch {}
  }
  res.json(DEFAULTS)
})

// PATCH /api/perks — admin, save the whole array
router.patch('/', adminAuth, async (req, res) => {
  const perks = req.body
  if (!Array.isArray(perks)) { res.status(400).json({ error: 'Expected array' }); return }
  const { error } = await supabase
    .from('settings')
    .upsert({ key: KEY, value: JSON.stringify(perks), updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) { res.status(500).json({ error: 'Failed to save perks' }); return }
  res.json({ success: true })
})

// Exported helper for order creation: compute earned gifts for a given total
export async function getEarnedGifts(total: number): Promise<string[]> {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', KEY).single()
    const perks: typeof DEFAULTS = data?.value ? JSON.parse(data.value) : DEFAULTS
    return perks
      .filter(p => p.active && p.threshold > 0 && p.giftName && total >= p.threshold)
      .map(p => `${p.emoji} ${p.giftName}`)
  } catch { return [] }
}

export default router
