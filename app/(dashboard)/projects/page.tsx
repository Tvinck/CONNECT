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

  const isCeoOrCoowner = profile.role === 'ceo' || profile.role === 'coowner'
  
  // For non-admins, get the list of project_ids they have access to.
  let allowedProjectIds: string[] | null = null
  if (!isCeoOrCoowner) {
    const { data: mems } = await supabase.from('project_members').select('project_id').eq('user_id', profile.id)
    allowedProjectIds = (mems ?? []).map(m => m.project_id)
  }

  let projectsQuery = supabase.from('projects').select('id, name, slug, emoji, color, status, progress, description').order('progress', { ascending: false })
  
  if (allowedProjectIds !== null) {
    projectsQuery = projectsQuery.in('id', allowedProjectIds.length ? allowedProjectIds : ['00000000-0000-0000-0000-000000000000'])
  }

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    projectsQuery,
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

  // Resolve member names so the cards can show avatar stacks.
  const allMemberIds = Array.from(new Set(Object.values(teams).flatMap(s => Array.from(s))))
  const { data: memberUsers } = allMemberIds.length
    ? await supabase.from('users').select('id, full_name').in('id', allMemberIds)
    : { data: [] as { id: string; full_name: string }[] }
  const nameById: Record<string, string> = {}
  for (const u of (memberUsers ?? []) as { id: string; full_name: string }[]) nameById[u.id] = u.full_name

  const enriched = ((projects ?? []) as ProjectMeta[]).map(p => {
    const memberIds = teams[p.id] ? Array.from(teams[p.id]) : []
    return {
      ...p,
      tasks: taskCounts[p.id] ?? 0,
      team: memberIds.length,
      members: memberIds.slice(0, 5).map(id => ({ id, full_name: nameById[id] ?? '' })),
    }
  })

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
