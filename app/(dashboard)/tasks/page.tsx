import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { TasksBoard, type TaskRow } from '@/components/tasks/TasksBoard'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function TasksPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  const [{ data: tasks }, { data: projects }, { data: users }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, priority, status, due_date, project:projects(id, name, color, emoji), assignee:users!assignee_id(id, full_name)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('projects').select('id, name, color').order('name'),
    supabase.from('users').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  const taskList = (tasks ?? []) as unknown as TaskRow[]
  const total = taskList.filter(t => t.status !== 'done').length

  return (
    <PageContainer>
      <Header
        title="Задачи"
        subtitle={`Канбан-доска команды · ${total} в работе`}
      />
      <TasksBoard
        initialTasks={taskList}
        projects={projects ?? []}
        users={users ?? []}
      />
    </PageContainer>
  )
}
