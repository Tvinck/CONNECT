import { notFound, redirect } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  ProjectDetail,
  type ProjectFull,
  type ProjectMemberRow,
  type ProjectLinkRow,
} from '@/components/projects/ProjectDetail'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { TaskRow } from '@/components/tasks/TasksBoard'

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  // Fetch the project first — subsequent queries need its id.
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, slug, emoji, color, status, progress, description, created_at')
    .eq('slug', params.slug)
    .single()

  if (!project) notFound()

  // Fetch all related data in parallel.
  const [
    { data: members },
    { data: links },
    { data: tasks },
    { data: allUsers },
  ] = await Promise.all([
    supabase
      .from('project_members')
      .select('role, user:users!user_id(id, full_name, role, position, status)')
      .eq('project_id', project.id)
      .order('added_at'),
    supabase
      .from('project_links')
      .select('id, label, url')
      .eq('project_id', project.id)
      .order('created_at'),
    supabase
      .from('tasks')
      .select('id, title, priority, status, due_date, assignee:users!assignee_id(id, full_name)')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name'),
  ])

  return (
    <PageContainer>
      <ProjectDetail
        project={project as unknown as ProjectFull}
        initialMembers={(members ?? []) as unknown as ProjectMemberRow[]}
        initialLinks={(links ?? []) as unknown as ProjectLinkRow[]}
        initialTasks={(tasks ?? []) as unknown as TaskRow[]}
        allUsers={allUsers ?? []}
      />
    </PageContainer>
  )
}
