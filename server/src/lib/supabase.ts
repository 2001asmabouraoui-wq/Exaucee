import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const url  = process.env.SUPABASE_URL!
const key  = process.env.SUPABASE_SERVICE_KEY!

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(url, key, { realtime: { transport: ws as any } })
