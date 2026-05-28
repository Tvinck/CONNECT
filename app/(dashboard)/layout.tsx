import { Sidebar } from '@/components/layout/Sidebar'
import { ToastHost } from '@/components/ui/ToastHost'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
      <ToastHost />
    </div>
  )
}
