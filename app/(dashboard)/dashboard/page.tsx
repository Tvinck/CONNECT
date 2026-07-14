import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationsWidget } from '@/components/dashboard/NotificationsWidget'
import { StatCardInteractive } from '@/components/dashboard/StatCardInteractive'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import {
  fmtRub, fmtNum, getInitials, colorFor, levelInfo, timeAgo, dueLabel,
  PRIORITY_COLOR,
} from '@/lib/utils'
import {
  Wallet, CheckSquare, CheckCircle, Coins, Flame,
  ArrowRight, Clock, ChevronRight, Bolt, Gift, MessageSquare,
} from 'lucide-react'

const NOTIF_TONE: Record<string, { bg: string; text: string }> = {
  task:  { bg: 'bg-accent/15', text: 'text-accent' },
  ach:   { bg: 'bg-gold/15',   text: 'text-gold' },
  alert: { bg: 'bg-err/15',    text: 'text-err' },
  info:  { bg: 'bg-accent/15', text: 'text-accent' },
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  const isCeoOrCoowner = profile.role === 'ceo' || profile.role === 'coowner'
  const today      = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd   = today.toISOString().slice(0, 10)

  const [
    activeCountRes,
    urgentCountRes,
    doneCountRes,
    clientsRes,
    myTasksRes,
    activityRes,
    projectsRes,
    notifRes,
    txRes,
  ] = await Promise.all([
    // My open tasks
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('assignee_id', profile.id).neq('status', 'done'),
    // My urgent open tasks
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('assignee_id', profile.id).neq('status', 'done').eq('priority', 'urgent'),
    // My closed tasks
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('assignee_id', profile.id).eq('status', 'done'),
    // Client turnover
    supabase.from('clients').select('total_spent, status'),
    // My tasks for the "today" list
    supabase.from('tasks')
      .select('id, title, due_date, priority, status, project:projects(name, color, emoji)')
      .eq('assignee_id', profile.id).neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false }).limit(5),
    // Recent team activity (latest created tasks)
    supabase.from('tasks')
      .select('id, title, status, created_at, creator:users!tasks_creator_id_fkey(full_name)')
      .order('created_at', { ascending: false }).limit(5),
    // Projects progress
    supabase.from('projects').select('*').order('progress', { ascending: false }),
    // My unread notifications
    supabase.from('notifications').select('*')
      .eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
    // CEO & Co-owner: current month P&L (this month only, no future-dated entries)
    isCeoOrCoowner
      ? supabase.from('transactions').select('type, amount').gte('date', monthStart).lte('date', monthEnd)
      : Promise.resolve({ data: null }),
  ])

  const activeCount = activeCountRes.count ?? 0
  const urgentCount = urgentCountRes.count ?? 0
  const doneCount = doneCountRes.count ?? 0

  const clients = (clientsRes.data ?? []) as { total_spent: number; status: string }[]
  const turnover = clients.reduce((s, c) => s + Number(c.total_spent || 0), 0)
  const payingClients = clients.filter((c) => c.status === 'active' || c.status === 'vip').length

  // CEO P&L (current month)
  type TxRow = { type: string; amount: number }
  const txRows = (txRes.data ?? []) as TxRow[]
  const plIncome  = txRows.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const plExpense = txRows.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const plProfit  = plIncome - plExpense
  const plMargin  = plIncome > 0 ? Math.round((plProfit / plIncome) * 100) : 0
  const currentMonth = new Date().toLocaleString('ru-RU', { month: 'long' })

  // Local types matching the select shapes above.
  type MyTaskRow = {
    id: string; title: string; due_date: string | null
    priority: string; status: string
    project: { name: string; color: string; emoji?: string } | null
  }
  type ActivityRow = {
    id: string; title: string; status: string; created_at: string
    creator: { full_name: string } | null
  }
  type ProjectRow  = { id: string; name: string; emoji?: string; color: string; status: string; progress: number }
  type NotifRow    = { id: string; type: string; title: string; body?: string; is_read: boolean; created_at: string }

  const myTasks      = (myTasksRes.data   ?? []) as unknown as MyTaskRow[]
  const activity     = (activityRes.data  ?? []) as unknown as ActivityRow[]
  const projects     = (projectsRes.data  ?? []) as ProjectRow[]
  const notifications = (notifRes.data    ?? []) as NotifRow[]

  const lvl = levelInfo(profile.points)
  const firstName = profile.full_name?.split(' ')[0] ?? 'друг'

  return (
    <PageContainer>
      <Header
        title={`С возвращением, ${firstName}! 👋`}
        subtitle={
          activeCount > 0
            ? `У тебя ${activeCount} ${activeCount === 1 ? 'задача' : 'задач'}${urgentCount ? `, ${urgentCount} горят 🔥` : ''}`
            : 'Все задачи закрыты — хорошего дня ✨'
        }
      />

      {/* ── Mobile quick-action view (hidden on md+) ── */}
      <div className="md:hidden mb-6 space-y-3">
        <p className="text-[13px] text-mute">
          {activeCount > 0
            ? `${activeCount} активных задач${urgentCount ? ` · ${urgentCount} срочных 🔥` : ''}`
            : 'Открытых задач нет ✨'}
        </p>
        {(
          [
            { href: '/tasks',    icon: CheckSquare,  label: 'Задачи',   sub: `${activeCount} активных`,           color: '#1472F5',  bg: 'bg-accent/15',  badge: activeCount > 0 ? activeCount : 0 },
            { href: '/finances', icon: Wallet,        label: 'Финансы',  sub: 'Доходы и расходы',                  color: '#FFC833',  bg: 'bg-gold/15',    badge: 0 },
            { href: '/chats',    icon: MessageSquare, label: 'Чаты',     sub: 'Командное общение',                  color: '#6F4FE8',  bg: 'bg-[#6F4FE8]/15', badge: 0 },
          ] as const
        ).map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 p-4 rounded-2xl border border-line bg-card hover:border-line2 hover:bg-black/[0.02] transition-all active:scale-[0.98]">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}
                style={{ color: item.color }}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-bold tracking-tight">{item.label}</div>
                <div className="text-[12px] text-mute mt-0.5">{item.sub}</div>
              </div>
              {item.badge > 0 && (
                <span className="shrink-0 min-w-[24px] h-6 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold inline-flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <ChevronRight size={16} className="text-mute2 shrink-0" />
            </Link>
          )
        })}
      </div>

      {/* ── Desktop dashboard (hidden on mobile) ── */}
      <div className="hidden md:block space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={<Wallet size={18} />}
          iconTone="bg-accent/15 text-accent"
          label="Оборот клиентов"
          value={fmtRub(turnover)}
          sub={<span className="text-mute text-[11px]">{payingClients} платящих</span>}
          subBg="bg-black/[0.04] border-line"
        />
        <StatCard
          icon={<CheckSquare size={18} />}
          iconTone="bg-cyan/15 text-cyan"
          label="Активных задач"
          value={fmtNum(activeCount)}
          sub={
            urgentCount > 0 ? (
              <span className="text-err inline-flex items-center gap-1 text-[11px]"><Flame size={12} /> {urgentCount} срочных</span>
            ) : (
              <span className="text-ok text-[11px]">нет срочных</span>
            )
          }
          subBg={urgentCount > 0 ? 'bg-err/10 border-err/20' : 'bg-ok/10 border-ok/20'}
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          iconTone="bg-ok/15 text-ok"
          label="Закрыто задач"
          value={fmtNum(doneCount)}
        />
        <StatCard
          icon={<Coins size={18} />}
          iconTone="bg-gold/15 text-gold"
          label="Баллов накоплено"
          value={fmtNum(profile.points)}
          sub={<span className="text-mute text-[11px]">{lvl.current.name}</span>}
          subBg="bg-black/[0.04] border-line"
        >
          <Progress value={lvl.progress} color="#FFC833" height={5} />
          <div className="flex items-center justify-between mt-2 text-[11px] text-mute2 font-mono">
            {lvl.next ? (
              <>
                <span>{profile.points} / {lvl.next.min}</span>
                <span>{lvl.remaining} до «{lvl.next.name}»</span>
              </>
            ) : (
              <span>Максимальный уровень 👑</span>
            )}
          </div>
        </StatCard>
      </div>

      {/* CEO & Co-owner P&L banner */}
      {isCeoOrCoowner && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Доходы', value: fmtRub(plIncome),  color: '#22C55E', sub: currentMonth },
            { label: 'Расходы', value: fmtRub(plExpense), color: '#EF4444', sub: currentMonth },
            { label: 'Прибыль', value: fmtRub(plProfit),  color: plProfit >= 0 ? '#22C55E' : '#EF4444', sub: 'чистая' },
            { label: 'Маржа',   value: `${plMargin}%`,    color: plMargin >= 30 ? '#22C55E' : plMargin >= 10 ? '#F59E0B' : '#EF4444', sub: 'рентабельность' },
          ].map(item => (
            <div key={item.label} className="card p-4 flex flex-col gap-1">
              <div className="text-[11px] text-mute2 uppercase tracking-[0.1em] font-semibold">{item.label}</div>
              <div className="text-[22px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</div>
              <div className="text-[10.5px] text-mute">{item.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tasks + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Мои задачи</h3>
              <p className="text-[12.5px] text-mute mt-0.5">
                {myTasks.length > 0 ? `${activeCount} активных, ближайший срок сверху` : 'Открытых задач нет'}
              </p>
            </div>
            <a href="/tasks" className="text-[12.5px] text-mute hover:text-slate-800 inline-flex items-center gap-1">
              Все задачи <ArrowRight size={13} />
            </a>
          </div>
          <div className="space-y-2">
            {myTasks.length === 0 && (
              <div className="text-center py-10 text-mute text-[13px]">Нет открытых задач 🎉</div>
            )}
            {myTasks.map((t) => {
              const project = t.project
              const color = project?.color ?? '#1472F5'
              const prio = PRIORITY_COLOR[t.priority] ?? '#8B92B4'
              return (
                <div key={t.id} className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-line hover:border-line2 hover:bg-black/[0.02] cursor-pointer transition-all">
                  <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[15px]"
                       style={{ background: `${color}22`, color }}>
                    {project?.emoji ?? '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium tracking-tight truncate group-hover:text-slate-800">{t.title}</div>
                    <div className="text-[11.5px] text-mute mt-0.5 flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        {project?.name ?? 'Без проекта'}
                      </span>
                      <span className="text-mute2">·</span>
                      <span className="inline-flex items-center gap-1"><Clock size={11} /> {dueLabel(t.due_date)}</span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: prio, boxShadow: `0 0 0 3px ${prio}30` }} />
                  <ChevronRight size={15} className="text-mute2 group-hover:text-mute" />
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Активность команды</h3>
              <p className="text-[12.5px] text-mute mt-0.5">Последние задачи</p>
            </div>
          </div>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-line" />
            <div className="space-y-5">
              {activity.length === 0 && (
                <div className="text-mute text-[13px] py-4">Пока пусто</div>
              )}
              {activity.map((a) => {
                const name = a.creator?.full_name ?? 'Кто-то'
                const color = colorFor(name)
                return (
                  <div key={a.id} className="relative">
                    <span className="absolute -left-[18px] top-1 w-3 h-3 rounded-full ring-4 ring-card" style={{ background: color }} />
                    <div className="flex items-start gap-2.5">
                      <Avatar initials={getInitials(name)} color={color} size={26} className="shrink-0 -ml-0.5" />
                      <div className="min-w-0">
                        <div className="text-[12.5px] leading-snug">
                          <span className="font-semibold">{name.split(' ')[0]}</span>{' '}
                          <span className="text-mute">создал задачу «{a.title}»</span>
                        </div>
                        <div className="text-[10.5px] text-mute2 mt-1 font-mono">{timeAgo(a.created_at)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Projects + Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Прогресс по проектам</h3>
              <p className="text-[12.5px] text-mute mt-0.5">Готовность к релизу</p>
            </div>
            <a href="/projects" className="text-[12.5px] text-mute hover:text-slate-800 inline-flex items-center gap-1">
              В проекты <ArrowRight size={13} />
            </a>
          </div>
          <div className="space-y-4">
            {projects.length === 0 && (
              <div className="text-mute text-[13px] py-4">Проектов пока нет</div>
            )}
            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[14px]"
                          style={{ background: `${p.color}22` }}>{p.emoji ?? '📁'}</span>
                    <div>
                      <div className="text-[13.5px] font-semibold tracking-tight">{p.name}</div>
                      <div className="text-[11px] text-mute capitalize">{p.status}</div>
                    </div>
                  </div>
                  <div className="text-[18px] font-bold tabular-nums tracking-tight" style={{ color: p.color }}>{p.progress}%</div>
                </div>
                <Progress value={p.progress} color={p.color} height={6} />
              </div>
            ))}
          </div>
        </div>

        <NotificationsWidget
          initialNotifications={notifications}
          userId={profile.id}
        />
      </div>

      {/* Level bar */}
      <div className="card p-6 overflow-hidden relative">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(255,200,51,0.18), transparent)' }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl inline-flex items-center justify-center bg-gold/15 text-gold border border-gold/30 shadow-glow-gold">
              <Bolt size={26} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-mute2 font-semibold">Твой уровень</div>
              <div className="text-[22px] font-bold tracking-tight">{lvl.current.name} <span className="text-gold">⚡</span></div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[12.5px] text-mute">{lvl.next ? `До «${lvl.next.name}»` : 'Максимальный уровень'}</div>
              <div className="text-[12.5px] font-mono text-mute">
                <span className="text-slate-800 font-semibold">{profile.points}</span>{lvl.next ? ` / ${lvl.next.min}` : ''} баллов
              </div>
            </div>
            <Progress value={lvl.progress} color="#FFC833" height={8} />
            <div className="flex items-center justify-between mt-2 text-[10.5px] text-mute2 font-mono uppercase tracking-wider">
              <span>Специалист</span>
              <span>Старший</span>
              <span>Эксперт</span>
              <span>Легенда</span>
            </div>
          </div>

          <a href="/shop" className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-bg border border-line2 hover:border-gold/40 hover:bg-gold/[0.05] text-[13px] font-semibold whitespace-nowrap transition-all">
            <Gift size={16} className="text-gold" />
            Магазин баллов
            <ArrowRight size={14} />
          </a>
        </div>
      </div>

      </div>
    </PageContainer>
  )
}

function StatCard({
  icon, iconTone, label, value, sub, subBg, children,
}: {
  icon: React.ReactNode
  iconTone: string
  label: string
  value: string
  sub?: React.ReactNode
  subBg?: string
  children?: React.ReactNode
}) {
  return (
    <StatCardInteractive>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconTone}`}>
          {icon}
        </div>
      </div>
      <div className="mt-5 text-[13px] text-mute font-medium tracking-tight">{label}</div>
      <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
        <div className="text-[36px] leading-none font-bold tracking-tight tabular-nums animate-rise whitespace-nowrap">{value}</div>
        {sub && (
          <span className={`inline-flex items-center gap-1 px-2 h-6 rounded-lg text-[11px] font-medium border tracking-tight whitespace-nowrap shrink-0 ${subBg}`}>
            {sub}
          </span>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </StatCardInteractive>
  )
}
