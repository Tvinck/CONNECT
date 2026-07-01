import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { FactoryClient } from '@/components/factory/FactoryClient'
import { getCurrentProfile } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function FactoryPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <span>🦝 ИИ Завод: Енот Чилл</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Генератор сценариев для коротких вертикальных видео (Higgsfield + Claude API).
        </p>
        
        <FactoryClient />
      </div>
    </PageContainer>
  )
}
