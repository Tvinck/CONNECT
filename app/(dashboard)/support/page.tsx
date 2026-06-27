import { PageContainer } from '@/components/layout/PageContainer'
import { SupportClient } from '@/components/support/SupportClient'
import { GGSelDisputes } from '@/components/support/GGSelDisputes'
import { SupportTabs } from '@/components/support/SupportTabs'

export const metadata = {
  title: 'Обращения клиентов — connect',
}

export default function SupportPage() {
  return (
    <div className="page-enter h-full px-2 sm:px-4 py-2 flex flex-col">
      <SupportTabs />
    </div>
  )
}
