import { createBrowserClient } from '@supabase/ssr'

export function createVeilClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY!
  )
}
