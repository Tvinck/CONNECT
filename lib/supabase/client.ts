/**
 * lib/supabase/client.ts — Browser-side Supabase client factory.
 *
 * Uses `@supabase/ssr`'s `createBrowserClient` which handles cookie-based
 * session management automatically in the browser.
 *
 * Call this from client components ('use client') only.
 * For server components and API routes use lib/supabase/server.ts.
 * For privileged admin operations use lib/supabase/admin.ts.
 *
 * Example:
 *  const supabase = createClient()
 *  const { data } = await supabase.from('tasks').select('*')
 */

import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

/** Returns a Supabase client configured for browser use (anon key, cookie session). */
export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return clientInstance
}
