import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastHost } from '@/components/ui/ToastHost'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single<User>()

  return (
    <AuthProvider user={profile ?? null}>
      <div className="h-screen flex bg-bg">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
        <ToastHost />
      </div>
    </AuthProvider>
  )
}
