import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import {
  Wallet, CheckSquare, CheckCircle, Coins, TrendingUp, Flame,
  ArrowRight, Clock, ChevronRight, Bolt, Gift,
} from 'lucide-react'

const PROJECTS = [
  { id: 'podari', name: 'ПодариМомент', emoji: '🎁', color: '#1472F5', progress: 80,  status: 'Активный' },
  { id: 'pixel',  name: 'PIXEL',        emoji: '✨', color: '#FF4D9D', progress: 35,  status: 'В разработке' },
  { id: 'bazzar', name: 'BAZZAR MARKET',emoji: '🛒', color: '#22C55E', progress: 12,  status: 'Планирование' },
]

const TASKS_TODAY = [
  { id: 't1', title: 'Доделать оплату Suno API',  project: 'podari', due: 'Срочно · сегодня', priority: '#EF4444',  emoji: '🎁', color: '#1472F5', projectName: 'ПодариМомент' },
  { id: 't2', title: 'Дизайн карточки заказа',    project: 'podari', due: 'Завтра',           priority: '#F59E0B',  emoji: '🎁', color: '#1472F5', projectName: 'ПодариМомент' },
  { id: 't3', title: 'Согласовать тариф PIXEL',   project: 'pixel',  due: 'К пятнице',        priority: '#1472F5',  emoji: '✨', color: '#FF4D9D', projectName: 'PIXEL' },
  { id: 't4', title: 'Подготовить пост в TG',     project: 'bazzar', due: 'След. неделя',     priority: '#8B92B4',  emoji: '🛒', color: '#22C55E', projectName: 'BAZZAR MARKET' },
]

const ACTIVITY = [
  { who: 'Иван',  initials: 'ИП', color: '#1472F5', text: 'закрыл задачу «Интеграция Stripe»', when: '5 мин назад' },
  { who: 'Маша',  initials: 'МЛ', color: '#FF4D9D', text: 'оставила комментарий в PIXEL',       when: '21 мин назад' },
  { who: 'Дима',  initials: 'ДО', color: '#22C55E', text: 'создал задачу «Аналитика воронки»',  when: '48 мин назад' },
  { who: 'Соня',  initials: 'СК', color: '#F59E0B', text: 'получила ачивку «Десятка»',          when: '2 ч назад' },
]

const NOTIFICATIONS = [
  { kind: 'task',  title: 'Новая задача от Маши',       sub: 'Дизайн карточки заказа · ПодариМомент', when: '3 мин' },
  { kind: 'ach',   title: 'Получена ачивка «Десятка»',  sub: 'Закрыто 10 задач подряд · +25 баллов',  when: '1 ч' },
  { kind: 'alert', title: 'Срочно: оплата Suno API',    sub: 'Дедлайн сегодня в 18:00',               when: '2 ч' },
]

const NOTIF_TONE: Record<string, { bg: string; text: string }> = {
  task:  { bg: 'bg-accent/15', text: 'text-accent' },
  ach:   { bg: 'bg-gold/15',   text: 'text-gold' },
  alert: { bg: 'bg-err/15',    text: 'text-err' },
}

export default function DashboardPage() {
  const points = 340
  const nextLevel = 500

  return (
    <PageContainer>
      <Header
        title="С возвращением, Артём! 👋"
        subtitle="Вторник, хороший день для дел. У тебя 5 задач, 2 горят 🔥"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={<Wallet size={18} />}
          iconTone="bg-accent/15 text-accent"
          label="Выручка сегодня"
          value="12 450 ₽"
          sub={<span className="text-ok inline-flex items-center gap-1 text-[11px]"><TrendingUp size={12} /> +18%</span>}
          subBg="bg-ok/10 border-ok/20"
        />
        <StatCard
          icon={<CheckSquare size={18} />}
          iconTone="bg-cyan/15 text-cyan"
          label="Активных задач"
          value="5"
          sub={<span className="text-err inline-flex items-center gap-1 text-[11px]"><Flame size={12} /> 2 срочных</span>}
          subBg="bg-err/10 border-err/20"
        >
          <div className="flex items-center gap-1.5 mt-1">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= 2 ? 'bg-err' : i === 3 ? 'bg-warn' : 'bg-accent/60'}`} />
            ))}
          </div>
        </StatCard>
        <StatCard
          icon={<CheckCircle size={18} />}
          iconTone="bg-ok/15 text-ok"
          label="Закрыто за неделю"
          value="23"
          sub={<span className="text-ok inline-flex items-center gap-1 text-[11px]"><TrendingUp size={12} /> +4</span>}
          subBg="bg-ok/10 border-ok/20"
        />
        <StatCard
          icon={<Coins size={18} />}
          iconTone="bg-gold/15 text-gold"
          label="Баллов накоплено"
          value="340"
          sub={<span className="text-mute text-[11px]">до Старший</span>}
          subBg="bg-white/[0.04] border-line"
        >
          <Progress value={(points / nextLevel) * 100} color="#FFC833" height={5} />
          <div className="flex items-center justify-between mt-2 text-[11px] text-mute2 font-mono">
            <span>{points} / {nextLevel}</span>
            <span>{nextLevel - points} осталось</span>
          </div>
        </StatCard>
      </div>

      {/* Tasks + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Мои задачи на сегодня</h3>
              <p className="text-[12.5px] text-mute mt-0.5">4 задачи, ближайший дедлайн через 6 часов</p>
            </div>
            <a href="/tasks" className="text-[12.5px] text-mute hover:text-white inline-flex items-center gap-1">
              Все задачи <ArrowRight size={13} />
            </a>
          </div>
          <div className="space-y-2">
            {TASKS_TODAY.map(t => (
              <div key={t.id} className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-line hover:border-line2 hover:bg-white/[0.02] cursor-pointer transition-all">
                <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[15px]"
                     style={{ background: `${t.color}22`, color: t.color }}>
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium tracking-tight truncate group-hover:text-white">{t.title}</div>
                  <div className="text-[11.5px] text-mute mt-0.5 flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }}/>
                      {t.projectName}
                    </span>
                    <span className="text-mute2">·</span>
                    <span className="inline-flex items-center gap-1"><Clock size={11}/> {t.due}</span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.priority, boxShadow: `0 0 0 3px ${t.priority}30` }} />
                <ChevronRight size={15} className="text-mute2 group-hover:text-mute" />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Активность команды</h3>
              <p className="text-[12.5px] text-mute mt-0.5">Последние 24 часа</p>
            </div>
          </div>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-line" />
            <div className="space-y-5">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[18px] top-1 w-3 h-3 rounded-full ring-4 ring-card" style={{ background: a.color }} />
                  <div className="flex items-start gap-2.5">
                    <Avatar initials={a.initials} color={a.color} size={26} className="shrink-0 -ml-0.5" />
                    <div className="min-w-0">
                      <div className="text-[12.5px] leading-snug">
                        <span className="font-semibold">{a.who}</span>{' '}
                        <span className="text-mute">{a.text}</span>
                      </div>
                      <div className="text-[10.5px] text-mute2 mt-1 font-mono">{a.when}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects + Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
        <div className="card p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Прогресс по проектам</h3>
              <p className="text-[12.5px] text-mute mt-0.5">Готовность к релизу</p>
            </div>
            <a href="/projects" className="text-[12.5px] text-mute hover:text-white inline-flex items-center gap-1">
              В проекты <ArrowRight size={13} />
            </a>
          </div>
          <div className="space-y-4">
            {PROJECTS.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[14px]"
                          style={{ background: `${p.color}22` }}>{p.emoji}</span>
                    <div>
                      <div className="text-[13.5px] font-semibold tracking-tight">{p.name}</div>
                      <div className="text-[11px] text-mute">{p.status}</div>
                    </div>
                  </div>
                  <div className="text-[18px] font-bold tabular-nums tracking-tight" style={{ color: p.color }}>{p.progress}%</div>
                </div>
                <Progress value={p.progress} color={p.color} height={6} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Уведомления</h3>
              <p className="text-[12.5px] text-mute mt-0.5">3 непрочитанных</p>
            </div>
            <button className="text-[12.5px] text-mute hover:text-white">Отметить всё</button>
          </div>
          <div className="space-y-3">
            {NOTIFICATIONS.map((n, i) => {
              const tone = NOTIF_TONE[n.kind]
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-line hover:border-line2 hover:bg-white/[0.02] cursor-pointer transition-all">
                  <div className={`w-9 h-9 rounded-lg ${tone.bg} ${tone.text} inline-flex items-center justify-center shrink-0`}>
                    {n.kind === 'task' && <CheckSquare size={16} />}
                    {n.kind === 'ach' && <span className="text-base">🏆</span>}
                    {n.kind === 'alert' && <Flame size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold tracking-tight">{n.title}</div>
                    <div className="text-[11.5px] text-mute mt-0.5 line-clamp-2">{n.sub}</div>
                  </div>
                  <span className="text-[10.5px] text-mute2 font-mono shrink-0">{n.when}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Level bar */}
      <div className="card p-6 mt-5 overflow-hidden relative">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(255,200,51,0.18), transparent)' }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl inline-flex items-center justify-center bg-gold/15 text-gold border border-gold/30 shadow-glow-gold">
              <Bolt size={26} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-mute2 font-semibold">Твой уровень</div>
              <div className="text-[22px] font-bold tracking-tight">Специалист <span className="text-gold">⚡</span></div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[12.5px] text-mute">До «Старший»</div>
              <div className="text-[12.5px] font-mono text-mute"><span className="text-white font-semibold">{points}</span> / {nextLevel} баллов</div>
            </div>
            <Progress value={(points / nextLevel) * 100} color="#FFC833" height={8} />
            <div className="flex items-center justify-between mt-2 text-[10.5px] text-mute2 font-mono uppercase tracking-wider">
              <span>Специалист</span>
              <span>Старший</span>
              <span>Эксперт</span>
              <span>Легенда</span>
            </div>
          </div>

          <button className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-white/[0.04] border border-line2 hover:border-gold/40 hover:bg-gold/[0.05] text-[13px] font-semibold whitespace-nowrap transition-all">
            <Gift size={16} className="text-gold" />
            Магазин баллов
            <ArrowRight size={14} />
          </button>
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
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconTone}`}>
          {icon}
        </div>
      </div>
      <div className="mt-5 text-[13px] text-mute font-medium tracking-tight">{label}</div>
      <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
        <div className="text-[36px] leading-none font-bold tracking-tight tabular-nums animate-rise whitespace-nowrap">{value}</div>
        {sub && (
          <span className={`inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-medium border tracking-tight whitespace-nowrap shrink-0 ${subBg}`}>
            {sub}
          </span>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
