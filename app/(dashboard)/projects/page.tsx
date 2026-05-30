import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { ProjectsClient } from '@/components/projects/ProjectsClient'
import { getCurrentProfile } from '@/lib/auth'
import type { ProjectStatus } from '@/types'
import { createClient } from '@/lib/supabase/server'

export default async function ProjectsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from('projects').select('id, name, slug, emoji, color, status, progress, description')
      .order('progress', { ascending: false }),
    supabase.from('tasks').select('project_id, assignee_id'),
  ])

  type TaskMeta    = { project_id: string | null; assignee_id: string | null }
  type ProjectMeta = { id: string; name: string; slug: string; emoji: string | null; color: string; status: ProjectStatus; progress: number; description: string | null }

  // Count tasks and distinct team members per project.
  const taskCounts: Record<string, number> = {}
  const teams: Record<string, Set<string>> = {}
  for (const t of (tasks ?? []) as TaskMeta[]) {
    if (!t.project_id) continue
    taskCounts[t.project_id] = (taskCounts[t.project_id] ?? 0) + 1
    if (t.assignee_id) {
      ;(teams[t.project_id] ??= new Set()).add(t.assignee_id)
    }
  }

  const enriched = ((projects ?? []) as ProjectMeta[]).map(p => ({
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
