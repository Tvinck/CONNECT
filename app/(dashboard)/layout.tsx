import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastHost } from '@/components/ui/ToastHost'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { getCurrentProfile } from '@/lib/auth'

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

  return (
    <AuthProvider user={profile}>
      <div className="h-screen flex bg-bg text-[#171821]">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
        <ToastHost />
        <OnboardingFlow role={profile.role} name={profile.full_name} />
      </div>
    </AuthProvider>
  )
}
