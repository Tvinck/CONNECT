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
import { createClient as createVeilClient } from '@supabase/supabase-js'
import type { TaskRow } from '@/components/tasks/TasksBoard'
import type { TxRow } from '@/components/finance/FinancesClient'

interface PageProps {
  params: {
    /** Уникальный текстовый идентификатор (slug) проекта */
    slug: string
  }
}

/**
 * Серверный компонент детальной страницы проекта.
 * Выполняет авторизационную проверку текущего пользователя, загружает базовые
 * метаданные проекта, параллельно запрашивает связанные сущности (участники, ссылки,
 * задачи, транзакции) и, если slug равен 'veil', динамически подключается к базе
 * данных Veil VPN для извлечения серверов, подписок, платежей и рефералов.
 *
 * @param props Свойства страницы, содержащие параметры маршрута
 * @returns React Server Component с контейнером детального представления
 */
export default async function ProjectDetailPage({ params }: PageProps) {
  // 1. Проверка авторизации сессии пользователя
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  // 2. Первичный запрос метаданных проекта по slug
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, slug, emoji, color, status, progress, description, created_at')
    .eq('slug', params.slug)
    .single()

  if (!project) notFound()

  // 3. Параллельный асинхронный запрос всех базовых сущностей проекта
  const [
    { data: members },
    { data: links },
    { data: tasks },
    { data: allUsers },
    { data: transactions },
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
    supabase
      .from('transactions')
      .select('*, project:projects(id, name, color)')
      .eq('project_id', project.id)
      .order('date', { ascending: false }),
  ])

  // 4. Динамическая загрузка данных VPN, если это проект Veil VPN
  let vpnServers = null
  let vpnSubscriptions = null
  let vpnOrders = null
  let vpnReferrals = null

  if (params.slug === 'veil' || params.slug === 'veil-vpn') {
    // Инициализация внешнего клиента базы данных Veil VPN
    const veilSupabase = createVeilClient(
      process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL || 'https://hvsexqyieibkspnnvigd.supabase.co',
      process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY || ''
    )

    const [
      { data: servers },
      { data: subs },
      { data: ords },
      { data: refs }
    ] = await Promise.all([
      veilSupabase.from('vpn_servers').select('*').order('name'),
      veilSupabase.from('subscriptions').select('*, profiles:user_id(*)').order('created_at', { ascending: false }),
      veilSupabase.from('orders').select('*, profiles:user_id(*)').order('created_at', { ascending: false }),
      veilSupabase.from('referrals').select('*, referrer:profiles!referrer_id(username), referred:profiles!referred_id(username)').order('created_at', { ascending: false })
    ])
    
    vpnServers = servers
    
    // Форматирование и сопоставление сущностей пользователей и подписок из внешней базы
    vpnSubscriptions = (subs ?? []).map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      username: s.profiles?.username || 'Без имени',
      telegram_username: s.profiles?.telegram_username || '',
      status: s.status,
      expires_at: s.expires_at,
      traffic_used: Number(s.traffic_used),
      traffic_limit: s.traffic_limit,
      subscription_key: s.subscription_key,
      token: s.token,
      tg_bot_linked: s.profiles?.tg_bot_linked || false,
      tg_channel_subscribed: s.profiles?.tg_channel_subscribed || false
    }))
    
    // Форматирование финансовых транзакций клиентов
    vpnOrders = (ords ?? []).map((o: any) => ({
      id: o.id,
      username: o.profiles?.username || 'Без имени',
      amount: o.amount,
      currency: o.currency,
      status: o.status,
      tariff_months: o.tariff_months,
      created_at: o.created_at
    }))

    // Сопоставление участников реферальной сети
    vpnReferrals = (refs ?? []).map((r: any) => ({
      id: r.id,
      referrer_username: r.referrer?.username || 'Аноним',
      referred_username: r.referred?.username || 'Аноним',
      status: r.status,
      bonus_days: r.bonus_days,
      created_at: r.created_at
    }))
  }

  return (
    <PageContainer>
      <ProjectDetail
        project={project as unknown as ProjectFull}
        initialMembers={(members ?? []) as unknown as ProjectMemberRow[]}
        initialLinks={(links ?? []) as unknown as ProjectLinkRow[]}
        initialTasks={(tasks ?? []) as unknown as TaskRow[]}
        initialTransactions={(transactions ?? []) as unknown as TxRow[]}
        allUsers={allUsers ?? []}
        vpnServers={vpnServers}
        vpnSubscriptions={vpnSubscriptions}
        vpnOrders={vpnOrders}
        vpnReferrals={vpnReferrals}
      />
    </PageContainer>
  )
}
