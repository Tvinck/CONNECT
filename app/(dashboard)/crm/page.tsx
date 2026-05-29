import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { CrmClient } from '@/components/crm/CrmClient'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function CrmPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

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
      <CrmClient initialClients={(clients ?? []) as any} managers={managers ?? []} />
    </PageContainer>
  )
}
