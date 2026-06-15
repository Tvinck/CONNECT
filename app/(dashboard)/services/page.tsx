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
  MessageSquare, BarChart3, Flame, Loader2,
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
  { id: 'all',       label: 'Все',        emoji: '✨' },
  { id: 'seo',       label: 'SEO',        emoji: '🔍' },
  { id: 'design',    label: 'Дизайн',     emoji: '🎨' },
  { id: 'dev',       label: 'Разработка', emoji: '💻' },
  { id: 'fin',       label: 'Финансы',    emoji: '💰' },
  { id: 'ai',        label: 'AI',         emoji: '🤖' },
  { id: 'analytics', label: 'Аналитика',  emoji: '📊' },
]

/** Static metadata for each service. The `slug` must match seeds in migration 0005. */
const SERVICES = [
  { slug: 'yandex-search',  name: 'Поисковая выдача',    desc: 'Позиции в Яндекс и Google',   cat: 'seo',     color: '#22C55E', icon: 'Globe'        },
  { slug: 'figma',          name: 'Figma',               desc: 'Макеты и прототипы',          cat: 'design',  color: '#FF4D9D', icon: 'Palette'      },
  { slug: 'github',         name: 'GitHub',              desc: 'Репозитории и PR',            cat: 'dev',     color: '#1472F5', icon: 'Code'         },
  { slug: 'supabase',       name: 'Supabase',            desc: 'База данных и auth',          cat: 'dev',     color: '#1472F5', icon: 'Layers'       },
  { slug: 'yukassa',        name: 'ЮKassa',              desc: 'Эквайринг и платежи',         cat: 'fin',     color: '#FFC833', icon: 'Wallet'       },
  { slug: 'suno-api',       name: 'Suno API',            desc: 'AI-генерация песен',          cat: 'ai',      color: '#6F4FE8', icon: 'Sparkle'      },
  { slug: 'heygen',         name: 'HeyGen',              desc: 'AI-видео с аватарами',        cat: 'ai',      color: '#6F4FE8', icon: 'Camera'       },
  { slug: 'chatgpt',        name: 'ChatGPT',             desc: 'Тексты, идеи, скрипты',       cat: 'ai',      color: '#6F4FE8', icon: 'MessageSquare'},
  { slug: 'yandex-metrika', name: 'Яндекс Метрика',      desc: 'Аналитика трафика',           cat: 'analytics',color: '#00C2FF',icon: 'TrendUp'      },
  { slug: 'sentry',         name: 'Sentry',              desc: 'Логи ошибок и мониторинг',    cat: 'analytics',color: '#00C2FF',icon: 'Flame'        },
  { slug: 'vps-panel',      name: 'VPS-панель',          desc: 'Серверы и деплои',            cat: 'dev',     color: '#1472F5', icon: 'Power'        },
  { slug: 'site-audit',     name: 'Аудит сайта',         desc: 'Технический и контентный',    cat: 'seo',     color: '#22C55E', icon: 'CheckCircle'  },
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
        <div className="card p-12 text-center text-mute text-[13.5px] border border-line bg-white/[0.02] mt-6">
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
                  : 'border-line bg-white/[0.02] text-mute hover:text-white hover:bg-white/[0.04] hover:border-line2'
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
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-line text-[12.5px] text-mute">
          Подключение и отключение сервисов доступно только руководству
        </div>
      )}

      {visible.length === 0 ? (
        <div className="card p-12 text-center text-mute text-[13px]">В этой категории пока нет сервисов</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((s) => {
            const IconComponent = ICON_MAP[s.icon] ?? Globe
            // Use DB state; fall back to false while loading.
            const isOn = loadingDb ? false : (connected[s.slug] ?? false)

            return (
              <div key={s.slug} className="card p-5 lift group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl inline-flex items-center justify-center"
                    style={{ background: `${s.color}22`, color: s.color }}>
                    <IconComponent size={20} />
                  </div>
                  <span className={`text-[10.5px] font-semibold px-2 h-5 rounded-full inline-flex items-center ${
                    loadingDb ? 'bg-white/[0.05] text-mute' : isOn ? 'bg-ok/15 text-ok' : 'bg-white/[0.05] text-mute'
                  }`}>
                    {loadingDb ? '…' : isOn ? '● Подключён' : '○ Отключён'}
                  </span>
                </div>
                <div className="text-[14px] font-semibold tracking-tight">{s.name}</div>
                <div className="text-[12px] text-mute mt-1">{s.desc}</div>

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
