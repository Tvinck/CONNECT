import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PMPanel } from '@/components/pm/PMPanel'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { PMOrder, PMProduct, PMClient, PMApiLog } from '@/components/pm/types'

export default async function PodariMomentPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  const [
    { data: orders },
    { data: products },
    { data: clients },
    { data: logs },
    { data: kieTasks },
  ] = await Promise.all([
    supabase
      .from('pm_orders')
      .select('*, product:pm_products(*)')
      .order('created_at', { ascending: false }),
    supabase
      .from('pm_products')
      .select('*')
      .order('sort_order'),
    supabase
      .from('pm_clients')
      .select('*')
      .order('last_order_at', { ascending: false }),
    supabase
      .from('pm_api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('pm_kie_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <PageContainer>
      <PMPanel
        initialOrders={(orders ?? []) as unknown as PMOrder[]}
        products={(products ?? []) as PMProduct[]}
        initialClients={(clients ?? []) as PMClient[]}
        initialLogs={(logs ?? []) as PMApiLog[]}
        initialKieTasks={(kieTasks ?? []) as unknown as Parameters<typeof PMPanel>[0]['initialKieTasks']}
      />
    </PageContainer>
  )
}
