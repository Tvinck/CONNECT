'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import {
  Globe, PenLine, Search, CheckCircle, Palette, Sparkles,
  Code2, Layers, Power, Wallet, TrendingUp, Zap, Video,
  MessageSquare, BarChart3, Flame
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'

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
  const [activeCat, setActiveCat] = useState('all')
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(SERVICES.map(s => [s.name, s.connected]))
  )

  const visible = activeCat === 'all' ? SERVICES : SERVICES.filter(s => s.cat === activeCat)
  const connectedCount = Object.values(connected).filter(Boolean).length

  return (
    <PageContainer>
      <Header title="Сервисы" subtitle={`${connectedCount} из ${SERVICES.length} подключено`} />

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {CATS.map((c) => {
          const isActive = c.id === activeCat
          const count = c.id === 'all' ? SERVICES.length : SERVICES.filter(s => s.cat === c.id).length
          return (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-medium transition-all border
                ${isActive
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

      {visible.length === 0 ? (
        <div className="card p-12 text-center text-mute text-[13px]">В этой категории пока нет сервисов</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((s) => {
            const IconComponent = ICON_MAP[s.icon] || Globe
            const isOn = connected[s.name]
            return (
              <div key={s.name} className="card p-5 lift group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl inline-flex items-center justify-center"
                       style={{ background: `${s.color}22`, color: s.color }}>
                    <IconComponent size={20} />
                  </div>
                  <span className={`text-[10.5px] font-semibold px-2 h-5 rounded-full inline-flex items-center ${isOn ? 'bg-ok/15 text-ok' : 'bg-white/[0.05] text-mute'}`}>
                    {isOn ? '● Подключён' : '○ Отключён'}
                  </span>
                </div>
                <div className="text-[14px] font-semibold tracking-tight">{s.name}</div>
                <div className="text-[12px] text-mute mt-1">{s.desc}</div>
                <button
                  onClick={() => setConnected(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                  className={`mt-4 w-full h-8 rounded-lg text-[12px] font-semibold transition-all border ${
                    isOn
                      ? 'border-line text-mute hover:text-err hover:border-err/30 hover:bg-err/5'
                      : 'border-accent/30 text-accent bg-accent/10 hover:bg-accent hover:text-white'
                  }`}
                >
                  {isOn ? 'Отключить' : 'Подключить'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
