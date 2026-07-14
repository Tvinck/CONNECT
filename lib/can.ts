/**
 * lib/can.ts — pure, dependency-free capability check.
 *
 * Safe to import from BOTH client and server components (no server-only
 * imports here). The async resolvers live in lib/capabilities.ts (server).
 */

/** Known capability keys. Free-form — add as needed. */
export type Capability =
  | 'apple_certs.approve'
  | (string & {})

/** CEO / co-owner bypass all capability checks. */
export function isSuperRole(role?: string | null): boolean {
  return role === 'ceo' || role === 'coowner'
}

/**
 * True if the user holds `cap`.
 * @param caps The user's resolved capability list (from getUserCapabilities).
 * @param cap  The capability to test.
 * @param role The user's role — super-roles pass everything.
 */
export function can(caps: string[] | undefined | null, cap: Capability, role?: string | null): boolean {
  if (isSuperRole(role)) return true
  return !!caps?.includes(cap)
}
