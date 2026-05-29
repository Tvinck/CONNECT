/**
 * lib/auth.ts — Server-side helper for retrieving the current user's profile.
 *
 * Exports a single React-cache-wrapped function `getCurrentProfile` that:
 *  1. Reads the session from cookies via the server Supabase client.
 *  2. If authenticated, fetches the matching row from the public `users` table.
 *  3. Returns null for unauthenticated visitors.
 *
 * The `cache()` wrapper means multiple calls within the **same server request**
 * (e.g. from the layout and the page simultaneously) share a single database
 * round-trip — the result is memoised for the lifetime of the request.
 */

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

/**
 * Returns the full profile row for the currently logged-in user, or null.
 *
 * Safe to call from any server component or async server action.
 * Do NOT call from client components — use `useAuthStore` on the client side.
 */
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
