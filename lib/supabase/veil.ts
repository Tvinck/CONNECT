import { createClient } from '@supabase/supabase-js'

export function createVeilClient() {
  const url = process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY || 'placeholder'
  
  return createClient(url, key)
}
