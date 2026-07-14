import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { ToastHost } from '@/components/ui/ToastHost'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { PresenceTracker } from '@/components/layout/PresenceTracker'
import { getCurrentProfile } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { getUserCapabilities } from '@/lib/capabilities'

/**
 * DashboardLayout
 * 
 * Главный макет (layout) для защищенной части приложения (dashboard).
 * Выполняет проверку авторизации на стороне сервера.
 * 
 * @param {object} props - Свойства компонента.
 * @param {React.ReactNode} props.children - Дочерние элементы (содержимое страницы).
 * @returns {JSX.Element} Обертка приложения с боковым меню, тостами и проверкой онбординга.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login?error=profile_missing')
  }

  const [permissions, capabilities] = await Promise.all([
    getUserPermissions(profile.role),
    getUserCapabilities(profile.id, profile.role),
  ])

  return (
    <AuthProvider user={profile} permissions={permissions} capabilities={capabilities}>
      <div className="h-screen flex bg-bg text-[#171821]">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
        <CommandPalette />
        <ToastHost />
        <PresenceTracker />
        <OnboardingFlow role={profile.role} name={profile.full_name} />
      </div>
    </AuthProvider>
  )
}
