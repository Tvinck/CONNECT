import { PageContainer } from '@/components/layout/PageContainer'
import { SupportClient } from '@/components/support/SupportClient'

export const metadata = {
  title: 'Обращения клиентов — connect',
}

export default function SupportPage() {
  return (
    <PageContainer
      title="Обращения клиентов"
      description="Единое окно для связи с клиентами (Telegram и другие каналы)"
    >
      <SupportClient />
    </PageContainer>
  )
}
