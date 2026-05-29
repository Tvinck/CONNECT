import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { KnowledgeClient } from '@/components/knowledge/KnowledgeClient'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function KnowledgePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()
  const { data: articles } = await supabase
    .from('knowledge_articles')
    .select('*, author:users!author_id(id, full_name)')
    .order('created_at', { ascending: false })

  return (
    <PageContainer>
      <Header title="База знаний" subtitle="Процессы, инструменты и FAQ команды" />
      <KnowledgeClient initialArticles={(articles ?? []) as any} />
    </PageContainer>
  )
}
