import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { FinancesClient } from '@/components/finance/FinancesClient'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { verifyPagePermission } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'

export default async function FinancesPage() {
  const profile = await verifyPagePermission('Финансы', 1)

  const supabase = createClient()

  const [{ data: transactions }, { data: projects }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, project:projects(id, name, color)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, color')
      .order('name'),
  ])

  return (
    <PageContainer>
      <Header title="Финансы" subtitle="Доходы, расходы и баланс" />
      <ErrorBoundary label="Ошибка загрузки финансов">
        <FinancesClient
          initialTransactions={(transactions ?? []) as Parameters<typeof FinancesClient>[0]['initialTransactions']}
          projects={projects ?? []}
        />
      </ErrorBoundary>
    </PageContainer>
  )
}
