import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/settings — public, returns all settings as {key: value}
router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) { res.status(500).json({ error: 'Failed to fetch settings' }); return }
  const result: Record<string, string> = {}
  for (const row of data ?? []) result[row.key] = row.value
  res.json(result)
})

// PATCH /api/settings/:key — admin, upsert a setting value
router.patch('/:key', adminAuth, async (req, res) => {
  const { key } = req.params
  const { value } = req.body
  if (value === undefined) { res.status(400).json({ error: 'value is required' }); return }
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) { res.status(500).json({ error: 'Failed to update setting' }); return }
  res.json({ success: true })
})

export default router
