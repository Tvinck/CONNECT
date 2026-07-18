import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Shield } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { AuditLogPanel } from '@/components/admin/AuditLogPanel'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const profile = await getCurrentProfile()
  // Allow CEO or specifically art.koshelev
  const isArt = profile?.email?.includes('art.koshelev') || profile?.role === 'ceo'
  if (!isArt) redirect('/dashboard')

  const supabase = createClient()
  const [
    { data: employees }, 
    { data: auditLogs },
    { data: projects },
    { data: projectMembers }
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, email, mention_tag, role, position, skills, last_seen, created_at, status')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, meta, created_at, user:users!audit_logs_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('projects')
      .select('id, name')
      .order('name'),
    supabase
      .from('project_members')
      .select('project_id, user_id, role')
  ])

  return (
    <PageContainer>
      <Header
        title="Администрирование"
        subtitle="Сотрудники, проекты, роли и доступы"
      />

      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold inline-flex items-center justify-center">
          <Shield size={16} />
        </div>
        <span className="text-[12px] text-mute">Системный сервис</span>
      </div>

      <AdminPanel 
        employees={employees ?? []} 
        projects={projects ?? []}
        projectMembers={projectMembers ?? []}
      />

      <div className="mt-6">
        <AuditLogPanel logs={(auditLogs ?? []).map(l => ({ ...l, user: Array.isArray(l.user) ? (l.user[0] ?? null) : l.user }))} />
      </div>
    </PageContainer>
  )
}
