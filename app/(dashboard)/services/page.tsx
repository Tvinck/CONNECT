/**
 * app/(dashboard)/services/page.tsx — External integrations dashboard.
 *
 * Displays all connected/disconnected services with category filters.
 * Connection state is persisted in the `service_connections` table so toggles
 * survive page reloads and are visible to the whole team.
 *
 * Each service card maps to a `slug` in the DB (defined in migration 0005).
 * Only CEO-role users should be able to toggle connections (enforced by RLS).
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Header } from '@/components/layout/Header'
import {
  Globe, PenLine, Search, CheckCircle, Palette, Sparkles,
  Code2, Layers, Power, Wallet, TrendingUp, Zap, Video,
  MessageSquare, BarChart3, Flame, Loader2, ExternalLink
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useUIStore } from '@/store/ui'

const ICON_MAP: Record<string, React.ElementType> = {
  Globe, Pencil: PenLine, Search, CheckCircle, Palette,
  Sparkle: Sparkles, Code: Code2, Layers, Power, Wallet,
  TrendUp: TrendingUp, Bolt: Zap, Camera: Video,
  MessageSquare, TrendDown: BarChart3, Flame,
}

const CATS = [
  { id: 'all',        label: 'Все',        emoji: '✨' },
  { id: 'management', label: 'Управление', emoji: '⚙️' },
  { id: 'seo',        label: 'SEO',        emoji: '🔍' },
  { id: 'design',     label: 'Дизайн',     emoji: '🎨' },
  { id: 'dev',        label: 'Разработка', emoji: '💻' },
  { id: 'fin',        label: 'Финансы',    emoji: '💰' },
  { id: 'ai',         label: 'AI',         emoji: '🤖' },
  { id: 'analytics',  label: 'Аналитика',  emoji: '📊' },
]

const SERVICES = [
  { slug: 'admin',          name: 'Администрирование',   desc: 'Управление сотрудниками',     cat: 'management', color: '#10b981', icon: 'Settings', url: '/admin' },
  { slug: 'bazzar-certs',   name: 'Bazzar Certs',        desc: 'Сертификаты Apple Developer', cat: 'dev', color: '#3b82f6', icon: 'Globe', url: 'https://bazzar-serts.shop' },
  { slug: 'bot-certs',      name: 'Бот @one_ibot',       desc: 'Telegram-бот сертификатов',   cat: 'dev', color: '#0ea5e9', icon: 'MessageSquare', url: 'https://t.me/one_ibot' },
  { slug: 'bazzar-market',  name: 'Bazzar Market',       desc: 'Маркетплейс товаров',         cat: 'dev', color: '#10b981', icon: 'Globe' },
  { slug: 'veil-vpn',       name: 'Veil VPN',            desc: 'VPN сервис',                  cat: 'dev', color: '#8b5cf6', icon: 'Globe' },
  { slug: 'system-monitor', name: 'Мониторинг Систем',   desc: 'Статус серверов и БД',        cat: 'analytics', color: '#ef4444', icon: 'Flame', url: '/monitoring' },
  { slug: 'ggsel-seller',   name: 'GGSel Seller',        desc: 'Панель продавца',             cat: 'fin', color: '#10b981', icon: 'Wallet', url: 'https://seller.ggsel.com/' },
  { slug: 'plati-market',   name: 'Digiseller (Plati)',  desc: 'Площадка товаров',            cat: 'fin', color: '#3b82f6', icon: 'Wallet', url: 'https://digiseller.ru/' },
  { slug: 'avito',          name: 'Авито',               desc: 'Площадка объявлений',         cat: 'fin', color: '#8b5cf6', icon: 'Globe', url: 'https://www.avito.ru/' },
  { slug: 'kie-ai',         name: 'Kie.ai',              desc: 'API ИИ и пиксель',            cat: 'ai', color: '#6F4FE8', icon: 'Sparkle', url: 'https://kie.ai/ru' },
  { slug: 'desslyhub',      name: 'DesslyHub',           desc: 'Партнер для продажи игр',     cat: 'dev', color: '#1472F5', icon: 'Globe', url: 'https://dbm.desslyhub.com' },
  { slug: 'github',         name: 'GitHub',              desc: 'Репозитории и PR',            cat: 'dev', color: '#1472F5', icon: 'Code', url: 'https://github.com' },
  { slug: 'supabase',       name: 'Supabase',            desc: 'База данных и auth',          cat: 'dev', color: '#10b981', icon: 'Layers', url: 'https://supabase.com' },
  { slug: 'yukassa',        name: 'ЮKassa',              desc: 'Эквайринг и платежи',         cat: 'fin', color: '#FFC833', icon: 'Wallet', url: 'https://yookassa.ru' },
  { slug: 'yandex-metrika', name: 'Яндекс Метрика',      desc: 'Аналитика трафика',           cat: 'analytics', color: '#00C2FF', icon: 'TrendUp', url: 'https://metrika.yandex.ru' },
]

export default function ServicesPage() {
  const supabase    = createClient()
  const { user, permissions } = useAuthStore()
  const { addToast } = useUIStore()
  const isCeoOrCoowner = user?.role === 'ceo' || user?.role === 'coowner'

  const [activeCat,  setActiveCat]  = useState('all')
  /** slug → is_connected (loaded from DB). */
  const [connected,  setConnected]  = useState<Record<string, boolean>>({})
  const [loadingDb,  setLoadingDb]  = useState(true)
  /** slug of the service currently being toggled (to show a spinner). */
  const [toggling,   setToggling]   = useState<string | null>(null)

  // Load persisted state from DB on mount.
  useEffect(() => {
    supabase
      .from('service_connections')
      .select('slug, is_connected')
      .then(({ data }) => {
        if (data) {
          setConnected(Object.fromEntries(data.map(r => [r.slug, r.is_connected])))
        }
        setLoadingDb(false)
      })
  }, [supabase])

  const toggle = async (slug: string) => {
    if (!isCeoOrCoowner) {
      addToast('Нет доступа', 'Управление сервисами доступно только руководству', 'warn')
      return
    }
    const next = !connected[slug]
    setToggling(slug)

    // Optimistic update
    setConnected(prev => ({ ...prev, [slug]: next }))

    const { error } = await supabase
      .from('service_connections')
      .upsert({ slug, is_connected: next, updated_by: user!.id, updated_at: new Date().toISOString() })

    setToggling(null)

    if (error) {
      // Revert on failure
      setConnected(prev => ({ ...prev, [slug]: !next }))
      addToast('Ошибка', error.message, 'err')
    }
  }

  const level = permissions?.['Сервисы'] ?? 2
  if (level === 0) {
    return (
      <PageContainer>
        <Header title="Сервисы" subtitle="Доступ ограничен" />
        <div className="card p-12 text-center text-mute text-[13.5px] border border-line bg-bg mt-6">
          🔐 Доступ ограничен. У вас нет прав для просмотра этого раздела.
        </div>
      </PageContainer>
    )
  }

  const visible = activeCat === 'all' ? SERVICES : SERVICES.filter(s => s.cat === activeCat)
  const connectedCount = Object.values(connected).filter(Boolean).length

  return (
    <PageContainer>
      <Header title="Сервисы" subtitle={`${connectedCount} из ${SERVICES.length} подключено`} />

      {/* Category filters */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {CATS.map((c) => {
          const isActive = c.id === activeCat
          const count = c.id === 'all' ? SERVICES.length : SERVICES.filter(s => s.cat === c.id).length
          return (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-medium transition-all border ${
                isActive
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'border-line bg-bg text-mute hover:text-slate-800 hover:bg-card-hover hover:border-line2'
              }`}
            >
              {c.emoji} {c.label}
              <span className={`text-[10px] ${isActive ? 'text-accent/70' : 'text-mute2'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* CEO & Co-owner only notice */}
      {!isCeoOrCoowner && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-bg border border-line text-[12.5px] text-mute">
          Подключение и отключение сервисов доступно только руководству
        </div>
      )}

      {visible.length === 0 ? (
        <div className="card p-12 text-center text-mute text-[13px]">В этой категории пока нет сервисов</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((s) => {
            if (s.slug === 'admin') {
              const isArt = user?.email?.includes('art.koshelev') || user?.role === 'ceo'
              if (!isArt) return null
              
              const IconComponent = ICON_MAP[s.icon] ?? Globe
              return (
                <div key={s.slug} className="card p-5 lift group flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl inline-flex items-center justify-center"
                      style={{ background: `${s.color}22`, color: s.color }}>
                      <IconComponent size={20} />
                    </div>
                    <span className="text-[10.5px] font-semibold px-2 h-5 rounded-full inline-flex items-center bg-accent/15 text-accent">
                      ● Системный
                    </span>
                  </div>
                  <div className="text-[14px] font-semibold tracking-tight">{s.name}</div>
                  <div className="text-[12px] text-mute mt-1 flex-1">{s.desc}</div>

                  <a href="/admin" className="mt-4 w-full h-8 rounded-lg text-[12px] font-semibold transition-all border inline-flex items-center justify-center gap-1.5 border-accent/30 text-accent bg-accent/10 hover:bg-accent hover:text-white">
                    Перейти
                  </a>
                </div>
              )
            }

            const IconComponent = ICON_MAP[s.icon] ?? Globe
            // Use DB state; fall back to false while loading.
            const isOn = loadingDb ? false : (connected[s.slug] ?? false)

            return (
              <div key={s.slug} className="card p-5 lift group flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl inline-flex items-center justify-center"
                    style={{ background: `${s.color}22`, color: s.color }}>
                    <IconComponent size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" 
                        className="w-7 h-7 rounded-full bg-black/[0.03] hover:bg-black/[0.07] flex items-center justify-center text-mute hover:text-slate-800 transition-colors"
                        title="Открыть сайт"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <span className={`text-[10.5px] font-semibold px-2 h-5 rounded-full inline-flex items-center ${
                      loadingDb ? 'bg-black/[0.05] text-mute' : isOn ? 'bg-ok/15 text-ok' : 'bg-black/[0.05] text-mute'
                    }`}>
                      {loadingDb ? '…' : isOn ? '● Подключён' : '○ Отключён'}
                    </span>
                  </div>
                </div>
                <div className="text-[14px] font-semibold tracking-tight">{s.name}</div>
                <div className="text-[12px] text-mute mt-1 flex-1">{s.desc}</div>

                <button
                  onClick={() => toggle(s.slug)}
                  disabled={!isCeoOrCoowner || loadingDb || toggling === s.slug}
                  className={`mt-4 w-full h-8 rounded-lg text-[12px] font-semibold transition-all border inline-flex items-center justify-center gap-1.5 ${
                    !isCeoOrCoowner || loadingDb
                      ? 'border-line text-mute cursor-not-allowed opacity-50'
                      : isOn
                        ? 'border-line text-mute hover:text-err hover:border-err/30 hover:bg-err/5'
                        : 'border-accent/30 text-accent bg-accent/10 hover:bg-accent hover:text-white'
                  }`}
                >
                  {toggling === s.slug
                    ? <><Loader2 size={12} className="animate-spin" /> Сохранение…</>
                    : isOn ? 'Отключить' : 'Подключить'
                  }
                </button>
              </div>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
