import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { CrmClient } from '@/components/crm/CrmClient'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { verifyPagePermission } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'

export default async function CrmPage() {
  const profile = await verifyPagePermission('CRM', 1)

  const supabase = createClient()
  const [{ data: clients }, { data: managers }] = await Promise.all([
    supabase
      .from('clients')
      .select('*, manager:users!manager_id(id, full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('users').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  return (
    <PageContainer>
      <Header title="CRM" subtitle="Клиентская база и воронка продаж" />
      <ErrorBoundary label="Ошибка загрузки CRM">
        <CrmClient initialClients={(clients ?? []) as any} managers={managers ?? []} />
      </ErrorBoundary>
    </PageContainer>
  )
}
