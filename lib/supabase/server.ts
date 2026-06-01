/**
 * lib/supabase/server.ts — Server-side Supabase client factory.
 *
 * Uses `@supabase/ssr`'s `createServerClient` which reads and writes the session
 * from Next.js cookies via the `cookies()` API.
 *
 * Use from:
 *  - Server components (layouts, pages)
 *  - API route handlers
 *  - Server actions
 *
 * The `set` and `remove` cookie handlers are wrapped in try/catch because
 * Server Components receive a read-only cookie store — mutation calls from
 * those contexts are silently ignored. Route handlers and middleware can write
 * cookies normally.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/** Returns a Supabase client that reads the auth session from server cookies. */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Server Components have a read-only cookie store — ignore write failures.
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )
}

/**
 * Service-role client that bypasses RLS.
 * ONLY use in trusted server-side contexts (CRON jobs, background tasks).
 * NEVER expose to the browser or use in client components.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
