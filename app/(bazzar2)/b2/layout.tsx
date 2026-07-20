import { TopNav } from '@/components/bazzar2/TopNav'
import { Watermark } from '@/components/bazzar2/Watermark'

export default function B2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      <Watermark />
    </div>
  )
}
