import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Shield } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { ManagementPanel } from '@/components/management/ManagementPanel'
import { AuditLogPanel } from '@/components/management/AuditLogPanel'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function ManagementPage() {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'ceo') redirect('/dashboard')

  const supabase = createClient()
  const [{ data: employees }, { data: auditLogs }] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, email, role, status')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, meta, created_at, user:users!audit_logs_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <PageContainer>
      <Header
        title="Управление"
        subtitle="Сотрудники, роли и права доступа"
      />

      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold inline-flex items-center justify-center">
          <Shield size={16} />
        </div>
        <span className="text-[12px] text-mute">Только для CEO</span>
      </div>

      <ManagementPanel employees={employees ?? []} />

      <div className="mt-6">
        <AuditLogPanel logs={(auditLogs ?? []).map(l => ({ ...l, user: Array.isArray(l.user) ? (l.user[0] ?? null) : l.user }))} />
      </div>
    </PageContainer>
  )
}
