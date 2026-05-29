import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { Shield, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/layout/PageContainer'
import { createClient } from '@/lib/supabase/server'

const EMPLOYEES = [
  { name: 'Маша Лебедева', initials: 'МЛ', color: '#FF4D9D', role: 'Дизайнер',  status: 'online',  email: 'masha@bazzar.group' },
  { name: 'Дима Орлов',    initials: 'ДО', color: '#22C55E', role: 'Fullstack', status: 'busy',    email: 'dima@bazzar.group' },
  { name: 'Соня Кирилова', initials: 'СК', color: '#F59E0B', role: 'Продажи',  status: 'offline', email: 'sonya@bazzar.group' },
  { name: 'Иван Петров',   initials: 'ИП', color: '#00C2FF', role: 'Frontend', status: 'online',  email: 'ivan@bazzar.group' },
  { name: 'Карина Тимош',  initials: 'КТ', color: '#6F4FE8', role: 'SEO · Чат', status: 'online',  email: 'karina@bazzar.group' },
]

const SECTIONS = ['Дашборд', 'Задачи', 'Проекты', 'База знаний', 'CRM', 'Заказы', 'Финансы', 'Чаты', 'Сервисы']
const ROLES_SHORT = ['Дизайн', 'Разработка', 'Продажи', 'Чат/SEO']
const PERMS: Record<string, number[]> = {
  'Дизайн':     [2, 2, 2, 2, 0, 1, 0, 2, 1],
  'Разработка': [2, 2, 2, 2, 0, 1, 0, 2, 2],
  'Продажи':    [2, 2, 1, 1, 2, 2, 1, 2, 1],
  'Чат/SEO':    [2, 2, 1, 2, 1, 1, 0, 2, 2],
}

const PERM_LABEL = ['—', 'Просмотр', 'Полный']
const PERM_TONE: Record<number, 'mute' | 'accent' | 'ok'> = { 0: 'mute', 1: 'accent', 2: 'ok' }

export default async function ManagementPage() {
  // Server-side authorization: this page is CEO-only. Hiding the nav link is
  // not enough — guard the route itself so a direct URL hit is rejected.
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  if (profile?.role !== 'ceo') {
    redirect('/dashboard')
  }

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-4">
        {/* Employees list */}
        <div className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold tracking-tight">Сотрудники</h3>
            <Button size="sm">
              <UserPlus size={14} /> Пригласить
            </Button>
          </div>
          <div className="space-y-2">
            {EMPLOYEES.map((e, i) => (
              <div key={i} className="card card-tight p-4 flex items-center gap-3">
                <Avatar initials={e.initials} color={e.color} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{e.name}</div>
                  <div className="text-[11.5px] text-mute truncate">{e.email}</div>
                </div>
                <Tag tone="mute">{e.role}</Tag>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions matrix */}
        <div className="xl:col-span-2">
          <h3 className="text-[17px] font-semibold tracking-tight mb-4">Матрица доступов</h3>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold">Раздел</th>
                  {ROLES_SHORT.map((r) => (
                    <th key={r} className="text-center px-3 py-3 text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((sec, si) => (
                  <tr key={sec} className="border-b border-line last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium">{sec}</td>
                    {ROLES_SHORT.map((r) => {
                      const val = PERMS[r]?.[si] ?? 0
                      return (
                        <td key={r} className="px-3 py-3 text-center">
                          <Tag tone={PERM_TONE[val]}>{PERM_LABEL[val]}</Tag>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
