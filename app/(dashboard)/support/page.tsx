import { PageContainer } from '@/components/layout/PageContainer'
import { SupportClient } from '@/components/support/SupportClient'

export const metadata = {
  title: 'Обращения клиентов — connect',
}

export default function SupportPage() {
  return (
    <PageContainer>
      <SupportClient />
    </PageContainer>
  )
}
