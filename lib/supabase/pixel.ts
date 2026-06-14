import { createClient } from '@supabase/supabase-js'

export function createPixelClient() {
  const url = process.env.PIXEL_SUPABASE_URL || 'https://ktookvpqtmzfccojarwm.supabase.co'
  const key = process.env.PIXEL_SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!key) {
    console.warn('⚠️ PIXEL_SUPABASE_SERVICE_ROLE_KEY is not defined in environment.')
  }
  
  return createClient(url, key, {
    auth: { persistSession: false }
  })
}
