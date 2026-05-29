import { createClient } from '@supabase/supabase-js'

// Admin client — uses the service_role key and BYPASSES all RLS.
// MUST only ever be imported from server-side code (API routes / server
// actions). Never import this into a client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
