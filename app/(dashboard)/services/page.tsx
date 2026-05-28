import { Header } from '@/components/layout/Header'
import {
  Globe, PenLine, Search, CheckCircle, Palette, Sparkles,
  Code2, Layers, Power, Wallet, TrendingUp, Zap, Video,
  MessageSquare, BarChart3, Flame
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  Globe, Pencil: PenLine, Search, CheckCircle, Palette,
  Sparkle: Sparkles, Code: Code2, Layers, Power, Wallet,
  TrendUp: TrendingUp, Bolt: Zap, Camera: Video,
  MessageSquare, TrendDown: BarChart3, Flame,
}

const CATS = [
  { id: 'all',       label: 'Все',       emoji: '✨' },
  { id: 'seo',       label: 'SEO',       emoji: '🔍' },
  { id: 'design',    label: 'Дизайн',    emoji: '🎨' },
  { id: 'dev',       label: 'Разработка',emoji: '💻' },
  { id: 'fin',       label: 'Финансы',   emoji: '💰' },
  { id: 'ai',        label: 'AI',        emoji: '🤖' },
  { id: 'analytics', label: 'Аналитика', emoji: '📊' },
]

const SERVICES = [
  { name: 'Поисковая выдача',    desc: 'Позиции в Яндекс и Google',   cat: 'seo',     color: '#22C55E', icon: 'Globe',    connected: true  },
  { name: 'Figma',               desc: 'Макеты и прототипы',          cat: 'design',  color: '#FF4D9D', icon: 'Palette',  connected: true  },
  { name: 'GitHub',              desc: 'Репозитории и PR',            cat: 'dev',     color: '#1472F5', icon: 'Code',     connected: true  },
  { name: 'Supabase',            desc: 'База данных и auth',          cat: 'dev',     color: '#1472F5', icon: 'Layers',   connected: true  },
  { name: 'ЮKassa',              desc: 'Эквайринг и платежи',         cat: 'fin',     color: '#FFC833', icon: 'Wallet',   connected: true  },
  { name: 'Suno API',            desc: 'AI-генерация песен',          cat: 'ai',      color: '#6F4FE8', icon: 'Sparkle',  connected: true  },
  { name: 'HeyGen',              desc: 'AI-видео с аватарами',        cat: 'ai',      color: '#6F4FE8', icon: 'Camera',   connected: true  },
  { name: 'ChatGPT',             desc: 'Тексты, идеи, скрипты',       cat: 'ai',      color: '#6F4FE8', icon: 'MessageSquare', connected: true },
  { name: 'Яндекс Метрика',      desc: 'Аналитика трафика',           cat: 'analytics',color: '#00C2FF', icon: 'TrendUp',  connected: true  },
  { name: 'Sentry',              desc: 'Логи ошибок и мониторинг',    cat: 'analytics',color: '#00C2FF', icon: 'Flame',    connected: false },
  { name: 'VPS-панель',          desc: 'Серверы и деплои',            cat: 'dev',     color: '#1472F5', icon: 'Power',    connected: false },
  { name: 'Аудит сайта',         desc: 'Технический и контентный',    cat: 'seo',     color: '#22C55E', icon: 'CheckCircle', connected: false },
]

export default function ServicesPage() {
  return (
    <>
      <Header title="Сервисы" subtitle="Инструменты и интеграции команды" />

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {CATS.map((c) => (
          <button
            key={c.id}
            className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-medium transition-all border
              ${c.id === 'all'
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'border-line bg-white/[0.02] text-mute hover:text-white hover:bg-white/[0.04] hover:border-line2'
              }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {SERVICES.map((s, i) => {
          const IconComponent = ICON_MAP[s.icon] || Globe
          return (
            <div key={i} className="card p-5 cursor-pointer lift group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl inline-flex items-center justify-center"
                     style={{ background: `${s.color}22`, color: s.color }}>
                  <IconComponent size={20} />
                </div>
                <span className={`text-[10.5px] font-semibold px-2 h-5 rounded-full inline-flex items-center ${s.connected ? 'bg-ok/15 text-ok' : 'bg-white/[0.05] text-mute'}`}>
                  {s.connected ? '● Подключён' : '○ Отключён'}
                </span>
              </div>
              <div className="text-[14px] font-semibold tracking-tight">{s.name}</div>
              <div className="text-[12px] text-mute mt-1">{s.desc}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
