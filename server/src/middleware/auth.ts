import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'

export async function adminAuth(req: Request, res: Response, next: NextFunction) {
  // ── Primary: Supabase JWT ─────────────────────────────────────────────────
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user?.email) {
        // Check env-configured super admins
        const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
          .split(',').map(e => e.trim()).filter(Boolean)
        if (adminEmails.includes(user.email)) return next()

        // Check admins table (email-based)
        const { data: adminRow } = await supabase
          .from('admins')
          .select('id')
          .eq('email', user.email)
          .maybeSingle()
        if (adminRow) return next()
      }
    } catch { /* token invalid — fall through */ }
  }

  // ── Fallback: x-admin-secret env super-admin ──────────────────────────────
  const secret = req.headers['x-admin-secret'] as string | undefined
  if (secret && secret === process.env.ADMIN_SECRET) return next()

  res.status(401).json({ error: 'Unauthorized' })
}
