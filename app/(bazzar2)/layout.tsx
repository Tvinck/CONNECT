import { redirect } from 'next/navigation'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ToastHost } from '@/components/ui/ToastHost'
import { PresenceTracker } from '@/components/layout/PresenceTracker'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { getCurrentProfile } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { getUserCapabilities } from '@/lib/capabilities'
import { createClient } from '@/lib/supabase/server'

/**
 * Layout командного центра BazzarSerts 2.0.
 * Своя оболочка БЕЗ левого сайдбара: та же серверная авторизация и провайдеры,
 * что и в дашборде, но вместо Sidebar — верхняя навигация (см. b2/layout.tsx).
 * Доступ — только ceo/coowner (пока).
 */
export default async function Bazzar2Layout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?error=profile_missing')

  // Доступ: ceo/coowner всегда; остальные — только если добавлены в участники
  // проекта BazzarSerts 2.0 (управляется в разделе «Команда и задачи»).
  if (profile.role !== 'ceo' && profile.role !== 'coowner') {
    const supabase = createClient()
    const { data: project } = await supabase.from('projects').select('id').eq('slug', 'bazzar-serts-2').maybeSingle()
    let allowed = false
    if (project) {
      const { data: mem } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', project.id)
        .eq('user_id', profile.id)
        .maybeSingle()
      allowed = !!mem
    }
    if (!allowed) redirect('/projects')
  }

  const [permissions, capabilities] = await Promise.all([
    getUserPermissions(profile.role),
    getUserCapabilities(profile.id, profile.role),
  ])

  return (
    <AuthProvider user={profile} permissions={permissions} capabilities={capabilities}>
      <div className="min-h-screen bg-bg text-[#171821]">
        {children}
        <CommandPalette />
        <ToastHost />
        <PresenceTracker />
      </div>
    </AuthProvider>
  )
}
