/**
 * lib/capabilities.ts — action-level permissions ("скиллы").
 *
 * Layered on top of the section matrix (lib/permissions.ts). A user HAS a
 * capability if it is granted to their role OR to them personally (hybrid).
 * CEO / co-owner implicitly have all capabilities.
 *
 * Every DB read here is fail-safe: if the tables don't exist yet (migration
 * 0037 not applied) or a query errors, we return empty — the app keeps working,
 * capabilities simply resolve to "none" until the migration runs.
 */

import { createClient } from './supabase/server'
import { isSuperRole, type Capability } from './can'

// Re-export the pure helpers so server code can import everything from here.
export { can, isSuperRole, type Capability } from './can'

/**
 * Resolves the full capability set for a user: union of role-level and
 * personal grants. Returns [] on any error (see file header).
 */
export async function getUserCapabilities(userId: string, role: string): Promise<string[]> {
  if (isSuperRole(role)) {
    // Super-roles pass every check anyway; no need to query.
    return []
  }
  try {
    const supabase = createClient()
    const [roleRes, userRes] = await Promise.all([
      supabase.from('role_capabilities').select('capability').eq('role', role),
      supabase.from('user_capabilities').select('capability').eq('user_id', userId),
    ])
    const set = new Set<string>()
    for (const r of (roleRes.data ?? []) as { capability: string }[]) set.add(r.capability)
    for (const r of (userRes.data ?? []) as { capability: string }[]) set.add(r.capability)
    return Array.from(set)
  } catch {
    return []
  }
}

/**
 * Returns the ids of every user who currently holds a capability — via a
 * personal grant or via their role. Used to route notifications (e.g. "notify
 * everyone who can approve certs"). Fail-safe: [] on error.
 */
export async function getUsersWithCapability(cap: Capability): Promise<string[]> {
  try {
    const supabase = createClient()
    const ids = new Set<string>()

    const { data: personal } = await supabase
      .from('user_capabilities').select('user_id').eq('capability', cap)
    for (const r of (personal ?? []) as { user_id: string }[]) ids.add(r.user_id)

    const { data: roleRows } = await supabase
      .from('role_capabilities').select('role').eq('capability', cap)
    const roles = (roleRows ?? []).map((r: { role: string }) => r.role)
    if (roles.length) {
      const { data: roleUsers } = await supabase.from('users').select('id').in('role', roles)
      for (const u of (roleUsers ?? []) as { id: string }[]) ids.add(u.id)
    }

    return Array.from(ids)
  } catch {
    return []
  }
}
