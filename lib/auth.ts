import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

// Fetches the current user's profile row. Wrapped in React `cache` so the
// layout and the page in the same request share a single round-trip.
export const getCurrentProfile = cache(async (): Promise<User | null> => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single<User>()

  return data
})
