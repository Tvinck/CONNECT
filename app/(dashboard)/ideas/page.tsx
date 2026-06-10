import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { IdeasClient } from '@/components/ideas/IdeasClient'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function IdeasPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  // Fetch projects for linking
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color, emoji')
    .order('name')

  // Fetch all tags
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name')
    .order('name')

  // Fetch users for mentions
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, mention_tag')
    .eq('is_active', true)
    .order('full_name')

  // Fetch ideas with relations
  const { data: ideas } = await supabase
    .from('ideas')
    .select(`
      *,
      project:projects(id, name, color, emoji),
      author:users!author_id(id, full_name),
      idea_tags(tag:tags(id, name)),
      comments:idea_comments(id),
      votes:idea_votes(user_id, value)
    `)
    .order('created_at', { ascending: false })

  return (
    <PageContainer>
      <IdeasClient
        initialIdeas={(ideas ?? []) as any}
        projects={projects ?? []}
        allTags={tags ?? []}
        users={users ?? []}
        currentUser={profile}
      />
    </PageContainer>
  )
}
