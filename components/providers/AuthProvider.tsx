'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export function AuthProvider({
  user,
  permissions,
  capabilities,
  children,
}: {
  user: User | null
  permissions?: Record<string, number>
  capabilities?: string[]
  children: React.ReactNode
}) {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  // Hydrate the store with the server-fetched profile, permissions and capabilities.
  useEffect(() => {
    setUser(user, permissions, capabilities)
    setLoading(false)
  }, [user, permissions, capabilities, setUser, setLoading])

  // React to sign-out / token changes in other tabs.
  useEffect(() => {
    const supabase = supabaseRef.current
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        router.replace('/login')
      }
    })
    return () => subscription.unsubscribe()
  }, [setUser, router])

  return <>{children}</>
}
