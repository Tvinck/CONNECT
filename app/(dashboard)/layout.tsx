import { Sidebar } from '@/components/layout/Sidebar'
import { ToastHost } from '@/components/ui/ToastHost'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex bg-bg">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
      <ToastHost />
    </div>
  )
}
