import { createClient } from '@supabase/supabase-js'

let veilClient: ReturnType<typeof createClient> | null = null

export function createVeilClient() {
  if (!veilClient) {
    veilClient = createClient(
      process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY!
    )
  }
  return veilClient
}
