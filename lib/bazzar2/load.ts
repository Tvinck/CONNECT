import { createServiceClient as createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Серверные загрузчики данных для разделов BazzarSerts 2.0.
// apple_certificates — единый реестр продаж сертификатов (source = канал);
// manual_registrations / bazzar_orders — апстрим-записи (лиды/заказы площадок).

const DAY = 86_400_000
export function daysAgoIso(n: number): string {
  return new Date(Date.now() - n * DAY).toISOString()
}

export interface Cert {
  id: string
  created_at: string
  udid: string
  plan_id: string
  api_cost: number
  sale_price: number
  source: string
  status: string
  crm_status: string
  approver_id: string | null
  approval_comment: string | null
}

export interface ManualReg {
  id: string
  code: string
  created_by_name: string | null
  platform: string
  guarantee_months: number
  price: number
  status: string
  udid: string | null
  extra_info: string | null
  created_at: string
  paid_at: string | null
}

export async function loadOverview() {
  const supabase = createClient()
  const since = daysAgoIso(60) // 60 дней — чтобы сравнить текущий период с прошлым
  const [certsRes, usersRes, ticketsRes, reviewsRes, pendingRes, manualRes, ordersRes] = await Promise.all([
    supabase
      .from('apple_certificates')
      .select('id, created_at, sale_price, api_cost, source, crm_status, udid, plan_id')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabase.from('bazzar_users').select('id, created_at').gte('created_at', daysAgoIso(60)),
    supabase.from('bazzar_tickets').select('id, status, admin_reply, created_at, type, message, udid').order('created_at', { ascending: false }).limit(50),
    supabase.from('bazzar_reviews').select('id, author, rating, text, status, created_at').order('created_at', { ascending: false }).limit(6),
    supabase.from('apple_certificates').select('id, created_at, sale_price, source, udid, plan_id, crm_status').in('crm_status', ['pending', 'in_progress']).order('created_at', { ascending: false }).limit(30),
    supabase.from('manual_registrations').select('id, code, platform, guarantee_months, price, status, udid, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('bazzar_orders').select('id, uniquecode, item_name, amount, source, status, created_at').gte('created_at', since).order('created_at', { ascending: false }),
  ])
  return {
    certs: (certsRes.data ?? []) as Cert[],
    users: usersRes.data ?? [],
    tickets: ticketsRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    pending: pendingRes.data ?? [],
    manual: manualRes.data ?? [],
    orders: ordersRes.data ?? [],
  }
}

export async function loadSales() {
  const supabase = createClient()
  const since = daysAgoIso(90)
  const [certsRes, ordersRes, manualRes] = await Promise.all([
    supabase.from('apple_certificates').select('id, created_at, sale_price, api_cost, source, crm_status, udid, plan_id').gte('created_at', since).order('created_at', { ascending: false }),
    supabase.from('bazzar_orders').select('id, uniquecode, item_name, amount, source, status, created_at, udid').gte('created_at', since).order('created_at', { ascending: false }),
    supabase.from('manual_registrations').select('id, code, platform, guarantee_months, price, status, udid, created_at, paid_at').gte('created_at', since).order('created_at', { ascending: false }),
  ])
  return {
    certs: (certsRes.data ?? []) as Cert[],
    orders: ordersRes.data ?? [],
    manual: (manualRes.data ?? []) as ManualReg[],
  }
}

export async function loadUsers() {
  // bazzar_users закрыт RLS (нет политики для authenticated). Раздел операторский
  // и серверный — читаем admin-клиентом (service role), минуя RLS.
  const supabase = createAdminClient()
  const [usersRes, certsRes, subsRes, ticketsRes, manualRes] = await Promise.all([
    supabase.from('bazzar_users').select('id, udid, status, plan, last_purchase, created_at, telegram').order('created_at', { ascending: false }).limit(1000),
    supabase.from('apple_certificates').select('id, udid, plan_id, sale_price, source, crm_status, created_at'),
    supabase.from('bazzar_subscriptions').select('id, udid, app_name, plan, price, status, expires_at, created_at'),
    supabase.from('bazzar_tickets').select('id, udid, type, message, status, admin_reply, created_at').order('created_at', { ascending: false }),
    supabase.from('manual_registrations').select('udid, device_model, platform').not('udid', 'is', null),
  ])
  return {
    users: (usersRes.data ?? []) as any[],
    certs: (certsRes.data ?? []) as any[],
    subs: (subsRes.data ?? []) as any[],
    tickets: (ticketsRes.data ?? []) as any[],
    manual: (manualRes.data ?? []) as any[],
    subsReady: !subsRes.error,
  }
}

export async function loadArticles() {
  const supabase = createClient()
  const { data } = await supabase
    .from('bazzar_articles')
    .select('*')
    .order('created_at', { ascending: false })
  return { articles: (data ?? []) as any[] }
}

export async function loadActivity() {
  const supabase = createClient()
  const [logsRes, usersRes] = await Promise.all([
    supabase.from('audit_logs').select('id, user_id, action, entity_type, entity_id, meta, created_at').order('created_at', { ascending: false }).limit(120),
    supabase.from('users').select('id, full_name').limit(100),
  ])
  return { logs: (logsRes.data ?? []) as any[], users: (usersRes.data ?? []) as { id: string; full_name: string }[] }
}

export async function loadSubscriptions() {
  const supabase = createClient()
  const [subsRes, appsRes] = await Promise.all([
    supabase.from('bazzar_subscriptions').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('bazzar_apps').select('id, name, is_active').order('name'),
  ])
  return { subs: (subsRes.data ?? []) as any[], apps: (appsRes.data ?? []) as any[], ready: !subsRes.error }
}

export async function loadCatalogExtras() {
  const supabase = createClient()
  const [appsRes, productsRes, variantsRes] = await Promise.all([
    supabase.from('bazzar_apps').select('*').order('created_at', { ascending: false }),
    supabase.from('bazzar_products').select('id, title, price, active').order('title'),
    supabase.from('bazzar_product_variants').select('*').order('sort_order'),
  ])
  return {
    apps: (appsRes.data ?? []) as any[],
    products: (productsRes.data ?? []) as any[],
    variants: (variantsRes.data ?? []) as any[],
    variantsReady: !variantsRes.error,
  }
}

export async function loadFinance() {
  const supabase = createClient()
  const since = daysAgoIso(90)
  const [certsRes, txRes] = await Promise.all([
    supabase.from('apple_certificates').select('id, created_at, sale_price, api_cost, source').gte('created_at', since),
    supabase
      .from('transactions')
      .select('id, type, amount, description, category, date')
      .or('description.ilike.%серт%,description.ilike.%ggsel%,description.ilike.%ручная%,description.ilike.%digiseller%,description.ilike.%bazzar%')
      .order('date', { ascending: false })
      .limit(100),
  ])
  return { certs: (certsRes.data ?? []) as Cert[], tx: txRes.data ?? [] }
}

export async function loadTeam() {
  const supabase = createClient()
  const { data: project } = await supabase.from('projects').select('id').eq('slug', 'bazzar-serts-2').maybeSingle()
  const pid = project?.id
  const [membersRes, tasksRes, usersRes] = await Promise.all([
    pid
      ? supabase.from('project_members').select('role, user:users!user_id(id, full_name, position, status, role)').eq('project_id', pid)
      : Promise.resolve({ data: [] as any[] }),
    pid
      ? supabase.from('tasks').select('id, title, status, priority, due_date, assignee:users!assignee_id(id, full_name)').eq('project_id', pid).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    supabase.from('users').select('id, full_name, position, role').eq('is_active', true).order('full_name'),
  ])
  return {
    projectId: pid ?? null,
    members: (membersRes.data ?? []) as any[],
    tasks: (tasksRes.data ?? []) as any[],
    allUsers: (usersRes.data ?? []) as any[],
  }
}

export async function loadRegistrations() {
  const supabase = createClient()
  const [certsRes, manualRes, usersRes] = await Promise.all([
    supabase.from('apple_certificates').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('manual_registrations').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('users').select('id, full_name').limit(50),
  ])
  return {
    certs: (certsRes.data ?? []) as Cert[],
    manual: (manualRes.data ?? []) as ManualReg[],
    users: (usersRes.data ?? []) as { id: string; full_name: string }[],
  }
}
