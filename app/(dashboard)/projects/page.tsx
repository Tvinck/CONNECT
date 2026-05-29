import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { ProjectsClient } from '@/components/projects/ProjectsClient'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function ProjectsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from('projects').select('id, name, emoji, color, status, progress, description')
      .order('progress', { ascending: false }),
    supabase.from('tasks').select('project_id, assignee_id'),
  ])

  // Count tasks and distinct team members per project.
  const taskCounts: Record<string, number> = {}
  const teams: Record<string, Set<string>> = {}
  for (const t of tasks ?? []) {
    const pid = (t as any).project_id
    if (!pid) continue
    taskCounts[pid] = (taskCounts[pid] ?? 0) + 1
    const aid = (t as any).assignee_id
    if (aid) {
      ;(teams[pid] ??= new Set()).add(aid)
    }
  }

  const enriched = (projects ?? []).map((p: any) => ({
    ...p,
    tasks: taskCounts[p.id] ?? 0,
    team: teams[p.id]?.size ?? 0,
  }))

  const activeCount = enriched.filter(p => p.status === 'active').length

  return (
    <PageContainer>
      <Header
        title="Проекты"
        subtitle={`${enriched.length} ${enriched.length === 1 ? 'проект' : 'проектов'}${activeCount ? ` · ${activeCount} активных` : ''} · BAZZAR Group`}
      />
      <ProjectsClient initialProjects={enriched} />
    </PageContainer>
  )
}
