/**
 * lib/supabase/admin.ts — Supabase admin client factory.
 *
 * Creates a Supabase client authenticated with the service_role secret key.
 * This client BYPASSES all Row Level Security (RLS) policies and has
 * unrestricted read/write access to every table.
 *
 * SECURITY RULES — this file must only ever be imported from:
 *  - API route handlers  (app/api/[...]/route.ts)
 *  - Server actions      (app/[...]/actions.ts)
 *  - Migration scripts   (supabase/seed*.ts)
 *
 * NEVER import this into:
 *  - Client components   ('use client')
 *  - Any file that might be bundled into the browser
 *  - A NEXT_PUBLIC_* environment variable (that would expose the key)
 *
 * The session is disabled because admin operations are stateless server calls.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Returns a new Supabase admin client for server-side privileged operations.
 * Call once per request — do not cache the instance across requests.
 *
 * Requires env vars:
 *  - NEXT_PUBLIC_SUPABASE_URL  — the project URL (safe to expose)
 *  - SUPABASE_SERVICE_ROLE_KEY — the secret service_role key (server-only)
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
