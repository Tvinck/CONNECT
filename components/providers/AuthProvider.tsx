'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export function AuthProvider({
  user,
  permissions,
  children,
}: {
  user: User | null
  permissions?: Record<string, number>
  children: React.ReactNode
}) {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  // Hydrate the store with the server-fetched profile and permissions.
  useEffect(() => {
    setUser(user, permissions)
    setLoading(false)
  }, [user, permissions, setUser, setLoading])

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
