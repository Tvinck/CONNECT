import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmployeesClient } from '@/components/employees/EmployeesClient'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function EmployeesPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('points', { ascending: false })

  // Count completed tasks per assignee.
  const { data: doneTasks } = await supabase
    .from('tasks')
    .select('assignee_id')
    .eq('status', 'done')

  const counts: Record<string, number> = {}
  for (const t of doneTasks ?? []) {
    const id = (t as any).assignee_id
    if (id) counts[id] = (counts[id] ?? 0) + 1
  }

  const employees = (users ?? []).map(u => ({ ...u, tasks_done: counts[(u as any).id] ?? 0 }))

  return (
    <PageContainer>
      <Header title="Сотрудники" subtitle={`${employees.length} человек в команде`} />
      <EmployeesClient employees={employees as any} />
    </PageContainer>
  )
}
