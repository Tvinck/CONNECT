/**
 * store/auth.ts — Zustand store for the authenticated user's session.
 *
 * Holds the current user profile object and derived role so that any client
 * component can read them without prop-drilling.
 *
 * Hydration:
 *  AuthProvider (components/AuthProvider.tsx) calls `setUser()` once on mount
 *  using the profile pre-fetched on the server. Subsequent Supabase auth events
 *  (SIGNED_OUT) are handled there too.
 *
 * Persistence:
 *  Only the `role` field is persisted to localStorage (key: 'connect-auth').
 *  This prevents layout flicker between page loads while the full profile loads.
 *  The `user` object itself is NOT persisted — it's hydrated fresh each session.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthState {
  /** Full profile row from the `users` table, or null if unauthenticated. */
  user: User | null
  /** The user's role — cached separately for fast access during layout render. */
  role: UserRole
  /** Cached permission levels for the role. */
  permissions: Record<string, number>
  /** True while AuthProvider is hydrating the store from the server session. */
  isLoading: boolean

  /** Set or clear the current user profile. Also updates `role` and `permissions` from parameters. */
  setUser: (user: User | null, permissions?: Record<string, number>) => void
  /** Override the role independently (rarely needed outside AuthProvider). */
  setRole: (role: UserRole) => void
  /** Toggle the loading spinner shown during initial auth check. */
  setLoading: (loading: boolean) => void
  /** Clear the user from the store on sign-out. */
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: 'dev',
      permissions: {},
      isLoading: true,

      setUser: (user, permissions) => set({ user, role: user?.role ?? 'dev', permissions: permissions ?? {} }),
      setRole: (role) => set({ role }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, role: 'dev', permissions: {} }),
    }),
    {
      name: 'connect-auth',
      // Persist the role and permissions — user data is always re-fetched from the server.
      partialize: (state) => ({ role: state.role, permissions: state.permissions }),
    }
  )
)
