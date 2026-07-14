'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X, ArrowRight, ArrowLeft, CheckSquare, Folder, BookOpen,
  Wallet, Music2, Shield, ShoppingBag, MessageSquare, Users,
  Zap, Home, Gift, LayoutGrid, Star, ChevronRight,
} from 'lucide-react'
import type { UserRole } from '@/types'

const STORAGE_KEY = 'connect_onboarding_v2'

// ─── step definitions ──────────────────────────────────────────────────────────

type StepId = 'welcome' | 'nav' | 'tasks' | 'projects' | 'role' | 'gamification' | 'done'

interface StepConfig {
  id: StepId
  title: string
  subtitle: string
  visual: React.ReactNode
  items?: { icon: React.ReactNode; label: string; desc: string }[]
  note?: string
}

const NAV_GROUPS = [
  {
    label: 'Работа', color: '#1472F5',
    items: [
      { icon: <Home size={14} />, label: 'Главная', desc: 'Твой дашборд: задачи, уведомления, прогресс' },
      { icon: <CheckSquare size={14} />, label: 'Задачи', desc: 'Канбан: К работе → В работе → Готово' },
      { icon: <Folder size={14} />, label: 'Проекты', desc: 'Прогресс, команда, бюджет каждого проекта' },
      { icon: <BookOpen size={14} />, label: 'База знаний', desc: 'Документы, инструкции, материалы компании' },
    ],
  },
  {
    label: 'Бизнес', color: '#FFC833',
    items: [
      { icon: <Wallet size={14} />, label: 'Финансы', desc: 'Доходы, расходы, транзакции по проектам' },
      { icon: <Gift size={14} />, label: 'ПодариМомент', desc: 'Управление сервисом ИИ-поздравлений' },
      { icon: <Users size={14} />, label: 'CRM', desc: 'База клиентов: лиды, активные, VIP' },
      { icon: <LayoutGrid size={14} />, label: 'Сервисы', desc: 'Интеграции и подключённые API' },
      { icon: <ShoppingBag size={14} />, label: 'Магазин', desc: 'Трать баллы на бонусы и призы' },
    ],
  },
  {
    label: 'Команда', color: '#6F4FE8',
    items: [
      { icon: <Users size={14} />, label: 'Сотрудники', desc: 'Профили, уровни, статусы команды' },
      { icon: <MessageSquare size={14} />, label: 'Чаты', desc: 'Каналы и личные сообщения' },
    ],
  },
  {
    label: 'Управление', color: '#FFC833',
    items: [
      { icon: <Shield size={14} />, label: 'Управление', desc: 'Таблица сотрудников: баллы, роли, задачи' },
    ],
  },
]

type RoleItem = { icon: React.ReactNode; label: string; desc: string }
const ROLE_STEPS: Record<UserRole, RoleItem[]> = {
  ceo: [
    { icon: <Wallet size={16} />,     label: 'Финансы',      desc: 'Полный P&L: доходы, расходы, прибыль по фильтрам и проектам' },
    { icon: <Gift size={16} />,       label: 'ПодариМомент', desc: 'Заказы, ИИ-генерация музыки, клиенты, промокоды, мониторинг' },
    { icon: <Shield size={16} />,     label: 'Управление',   desc: 'Таблица команды: начисляй баллы, меняй роли' },
    { icon: <Users size={16} />,      label: 'CRM',          desc: 'Воронка клиентов, добавление и редактирование' },
    { icon: <Music2 size={16} />,     label: 'Kie.ai',       desc: 'Генерация ИИ-музыки для поздравлений через Suno API' },
  ],
  coowner: [
    { icon: <Wallet size={16} />,     label: 'Финансы',      desc: 'Полный P&L: доходы, расходы, прибыль по фильтрам и проектам' },
    { icon: <Gift size={16} />,       label: 'ПодариМомент', desc: 'Заказы, ИИ-генерация музыки, клиенты, промокоды, мониторинг' },
    { icon: <Users size={16} />,      label: 'CRM',          desc: 'Воронка клиентов, добавление и редактирование' },
    { icon: <Music2 size={16} />,     label: 'Kie.ai',       desc: 'Генерация ИИ-музыки для поздравлений через Suno API' },
    { icon: <Folder size={16} />,     label: 'Проекты',      desc: 'Участвуй в проектах, управляй участниками и ссылками' },
  ],
  sales: [
    { icon: <Users size={16} />,      label: 'CRM',          desc: 'Веди базу клиентов: статус, менеджер, оборот' },
    { icon: <Gift size={16} />,       label: 'ПодариМомент', desc: 'Следи за заказами и генерацией поздравлений' },
    { icon: <Folder size={16} />,     label: 'Проекты',      desc: 'Участвуй в проектах, отслеживай дедлайны' },
    { icon: <MessageSquare size={16} />, label: 'Чаты',      desc: 'Общайся с командой в каналах и личных сообщениях' },
  ],
  design: [
    { icon: <Folder size={16} />,     label: 'Проекты',      desc: 'Проекты с задачами, прогрессом и бюджетом' },
    { icon: <CheckSquare size={16} />,label: 'Задачи',        desc: 'Все твои задачи в одном месте с приоритетами' },
    { icon: <BookOpen size={16} />,   label: 'База знаний',  desc: 'Брендбук, гайдлайны, референсы компании' },
    { icon: <MessageSquare size={16} />, label: 'Чаты',      desc: 'Каналы по проектам и общий чат команды' },
  ],
  dev: [
    { icon: <Folder size={16} />,     label: 'Проекты',      desc: 'Трек задач по проектам, прогресс, транзакции' },
    { icon: <CheckSquare size={16} />,label: 'Задачи',        desc: 'Канбан с приоритетами: todo → in progress → done' },
    { icon: <BookOpen size={16} />,   label: 'База знаний',  desc: 'Тех. документация, инструкции, материалы' },
    { icon: <LayoutGrid size={16} />, label: 'Сервисы',      desc: 'Все подключённые интеграции и API ключи' },
  ],
  support: [
    { icon: <MessageSquare size={16} />, label: 'Чаты',      desc: 'Быстро отвечай клиентам в общих каналах' },
    { icon: <Users size={16} />,      label: 'CRM',          desc: 'Проверяй историю клиентов перед ответом' },
    { icon: <CheckSquare size={16} />,label: 'Задачи',        desc: 'Тикеты и поручения от команды' },
    { icon: <BookOpen size={16} />,   label: 'База знаний',  desc: 'Скрипты и FAQ для ответов клиентам' },
  ],
}

const ROLE_LABEL: Record<UserRole, string> = {
  ceo: 'CEO', coowner: 'Совладелец', design: 'Дизайнер', dev: 'Разработчик', sales: 'Продажи', support: 'Поддержка',
}
const ROLE_COLOR: Record<UserRole, string> = {
  ceo: '#FFC833', coowner: '#6F4FE8', design: '#FF4D9D', dev: '#1472F5', sales: '#F59E0B', support: '#22C55E',
}

// ─── sub-components ────────────────────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current ? 'w-5 h-1.5 bg-accent' : i < current ? 'w-1.5 h-1.5 bg-accent/40' : 'w-1.5 h-1.5 bg-white/[0.12]'
          }`}
        />
      ))}
    </div>
  )
}

// ─── OnboardingFlow ────────────────────────────────────────────────────────────

interface Props {
  role: UserRole
  name: string
}

export function OnboardingFlow({ role, name }: Props) {
  const [visible, setVisible] = useState(false)
  const [step,    setStep]    = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setVisible(true)
  }, [])

  const dismiss = useCallback(() => {
    setExiting(prev => {
      if (prev) return prev // already dismissing — ignore duplicate calls
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, 'done')
        setVisible(false)
      }, 280)
      return true
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
      if (e.key === 'ArrowRight' || e.key === 'Enter') setStep(s => Math.min(s + 1, STEPS.length - 1))
      if (e.key === 'ArrowLeft') setStep(s => Math.max(s - 1, 0))
    }
    if (visible) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, dismiss]) // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent the dashboard behind the onboarding overlay from scrolling.
  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [visible])

  const firstName = name.split(' ')[0]

  const STEPS = [
    // ── 1. Welcome ─────────────────────────────────────────────────────────────
    {
      id: 'welcome',
      content: (
        <div className="text-center px-2">
          <div className="text-[56px] mb-4 leading-none select-none">👋</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-mute2 font-semibold mb-2">BAZZAR Group</div>
          <h2 className="text-[26px] font-bold tracking-tight mb-3">
            Привет, {firstName}!
          </h2>
          <p className="text-[14px] text-mute leading-relaxed max-w-[340px] mx-auto">
            Добро пожаловать в <span className="text-white font-semibold">CONNECT</span> — внутреннюю платформу команды.
            Покажем как всё устроено за&nbsp;1&nbsp;минуту.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-line text-[12.5px]">
            <span
              className="px-2 h-5 rounded text-[10.5px] font-bold inline-flex items-center"
              style={{ background: `${ROLE_COLOR[role]}22`, color: ROLE_COLOR[role] }}
            >
              {ROLE_LABEL[role]}
            </span>
            <span className="text-mute">· твоя роль в системе</span>
          </div>
        </div>
      ),
    },

    // ── 2. Navigation ──────────────────────────────────────────────────────────
    {
      id: 'nav',
      content: (
        <div>
          <div className="text-center mb-5">
            <div className="text-[32px] mb-2 select-none">🗂️</div>
            <h2 className="text-[20px] font-bold tracking-tight">Как устроено меню</h2>
            <p className="text-[12.5px] text-mute mt-1">Слева — 4 раздела. Каждый для своих задач.</p>
          </div>
          <div className="space-y-2">
            {NAV_GROUPS.filter(g => role === 'ceo' || g.label !== 'Управление').map(group => (
              <div key={group.label} className="rounded-xl border border-line bg-white/[0.02] overflow-hidden">
                <div
                  className="px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] flex items-center gap-2"
                  style={{ color: group.color }}
                >
                  <div className="w-1 h-3 rounded-full" style={{ background: group.color }} />
                  {group.label}
                </div>
                <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-1">
                  {group.items.map(item => (
                    <div key={item.label} className="flex items-start gap-2 py-0.5">
                      <span className="text-mute2 mt-0.5 shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-white/90">{item.label}</div>
                        <div className="text-[10.5px] text-mute2 leading-snug">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 3. Tasks ───────────────────────────────────────────────────────────────
    {
      id: 'tasks',
      content: (
        <div>
          <div className="text-center mb-5">
            <div className="text-[32px] mb-2 select-none">✅</div>
            <h2 className="text-[20px] font-bold tracking-tight">Задачи — основа работы</h2>
            <p className="text-[12.5px] text-mute mt-1">Все поручения, дедлайны и приоритеты в одном месте.</p>
          </div>

          {/* Kanban flow */}
          <div className="flex items-center gap-1 mb-4 text-[11px]">
            {[
              { label: 'К работе', color: '#8B92B4' },
              { label: 'В работе', color: '#1472F5' },
              { label: 'Ревью',    color: '#F59E0B' },
              { label: 'Готово',   color: '#22C55E' },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-1">
                <div
                  className="px-2.5 h-6 rounded-lg font-semibold inline-flex items-center"
                  style={{ background: `${s.color}20`, color: s.color }}
                >
                  {s.label}
                </div>
                {i < arr.length - 1 && <ChevronRight size={12} className="text-mute2 shrink-0" />}
              </div>
            ))}
          </div>

          {/* Priority */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: '🔴 Срочно',   desc: 'Нужно сделать сегодня',     color: '#EF4444' },
              { label: '🟡 Высокий',  desc: 'Важно, но не горит',        color: '#F59E0B' },
              { label: '🔵 Обычный',  desc: 'Стандартный приоритет',     color: '#1472F5' },
              { label: '⚪ Низкий',   desc: 'Когда будет время',         color: '#8B92B4' },
            ].map(p => (
              <div key={p.label} className="rounded-xl bg-white/[0.025] border border-line px-3 py-2">
                <div className="text-[12.5px] font-semibold">{p.label}</div>
                <div className="text-[11px] text-mute">{p.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-[12.5px]">
            <Zap size={14} className="text-gold shrink-0" />
            <span className="text-white/80">За каждую выполненную задачу ты получаешь <span className="text-gold font-bold">баллы</span> — они идут на твой уровень.</span>
          </div>
        </div>
      ),
    },

    // ── 4. Projects + KB ───────────────────────────────────────────────────────
    {
      id: 'projects',
      content: (
        <div>
          <div className="text-center mb-5">
            <div className="text-[32px] mb-2 select-none">📁</div>
            <h2 className="text-[20px] font-bold tracking-tight">Проекты и знания</h2>
            <p className="text-[12.5px] text-mute mt-1">Отслеживай прогресс команды и находи нужную информацию.</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent inline-flex items-center justify-center">
                  <Folder size={17} />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold">Проекты</div>
                  <div className="text-[11.5px] text-mute">Полная картина каждого проекта</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Прогресс', desc: '% готовности' },
                  { label: 'Команда',  desc: 'Кто участвует' },
                  { label: 'Бюджет',   desc: 'Транзакции' },
                ].map(f => (
                  <div key={f.label} className="text-center py-2 px-1 rounded-lg bg-white/[0.03]">
                    <div className="text-[12px] font-semibold">{f.label}</div>
                    <div className="text-[10.5px] text-mute2">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#6F4FE8]/15 text-[#6F4FE8] inline-flex items-center justify-center">
                  <BookOpen size={17} />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold">База знаний</div>
                  <div className="text-[11.5px] text-mute">Документы, инструкции, референсы</div>
                </div>
              </div>
              <p className="text-[12px] text-mute">
                Все материалы компании в одном месте. Создавай статьи, ищи по тексту, фильтруй по категориям.
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // ── 5. Role-specific ───────────────────────────────────────────────────────
    {
      id: 'role',
      content: (
        <div>
          <div className="text-center mb-5">
            <div className="text-[32px] mb-2 select-none">🎯</div>
            <h2 className="text-[20px] font-bold tracking-tight">Твои главные инструменты</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span
                className="px-3 h-6 rounded-lg text-[11px] font-bold inline-flex items-center"
                style={{ background: `${ROLE_COLOR[role]}20`, color: ROLE_COLOR[role] }}
              >
                {ROLE_LABEL[role]}
              </span>
              <span className="text-[12px] text-mute">— разделы специально для тебя:</span>
            </div>
          </div>

          <div className="space-y-2">
            {ROLE_STEPS[role].map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.025] border border-line hover:border-line2 transition-colors">
                <div
                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0"
                  style={{ background: `${ROLE_COLOR[role]}18`, color: ROLE_COLOR[role] }}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{item.label}</div>
                  <div className="text-[11.5px] text-mute">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 6. Gamification ────────────────────────────────────────────────────────
    {
      id: 'gamification',
      content: (
        <div>
          <div className="text-center mb-5">
            <div className="text-[32px] mb-2 select-none">⚡</div>
            <h2 className="text-[20px] font-bold tracking-tight">Баллы и уровни</h2>
            <p className="text-[12.5px] text-mute mt-1">Работай — развивайся — получай бонусы.</p>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { emoji: '✅', title: 'Выполняй задачи',    desc: 'Каждая закрытая задача = баллы на счёт',   color: '#22C55E' },
              { emoji: '📈', title: 'Повышай уровень',    desc: 'Специалист → Старший → Мастер → Легенда', color: '#FFC833' },
              { emoji: '🛍️', title: 'Трать в магазине',  desc: 'Обменивай баллы на призы и бонусы',        color: '#6F4FE8' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.025] border border-line">
                <div className="text-[24px] shrink-0 select-none">{item.emoji}</div>
                <div>
                  <div className="text-[13px] font-semibold">{item.title}</div>
                  <div className="text-[11.5px] text-mute">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-line text-[12px] text-mute">
            <Star size={13} className="text-gold shrink-0 mt-0.5" />
            Уровень и баллы видны всей команде — на странице Сотрудники.
          </div>
        </div>
      ),
    },

    // ── 7. Done ─────────────────────────────────────────────────────────────────
    {
      id: 'done',
      content: (
        <div className="text-center px-2">
          <div className="text-[56px] mb-4 leading-none select-none">🚀</div>
          <h2 className="text-[24px] font-bold tracking-tight mb-3">Всё готово!</h2>
          <p className="text-[14px] text-mute leading-relaxed max-w-[340px] mx-auto mb-5">
            Начни с{' '}
            <a href="/dashboard" className="text-accent hover:underline font-medium">главной страницы</a>
            {' '}или перейди сразу в нужный раздел.
          </p>
          <div className="grid grid-cols-2 gap-2 max-w-[320px] mx-auto text-left">
            {[
              { href: '/tasks',    icon: <CheckSquare size={14} />,    label: 'Задачи',    color: '#1472F5' },
              { href: '/projects', icon: <Folder size={14} />,         label: 'Проекты',   color: '#6F4FE8' },
              { href: '/chats',    icon: <MessageSquare size={14} />,  label: 'Чаты',      color: '#6F4FE8' },
              { href: '/profile',  icon: <Star size={14} />,           label: 'Профиль',   color: '#FFC833' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={dismiss}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-line hover:border-line2 hover:bg-white/[0.04] transition-colors"
              >
                <span style={{ color: link.color }}>{link.icon}</span>
                <span className="text-[12.5px] font-medium">{link.label}</span>
                <ChevronRight size={12} className="ml-auto text-mute2" />
              </a>
            ))}
          </div>
        </div>
      ),
    },
  ]

  if (!visible) return null

  const isFirst = step === 0
  const isLast  = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'rgba(7,9,26,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className={`relative w-full max-w-[520px] rounded-2xl border border-line bg-[#0D1028] text-white shadow-2xl transition-all duration-300 ${
          exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <ProgressDots total={STEPS.length} current={step} />
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] inline-flex items-center justify-center transition-all"
            aria-label="Закрыть"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[360px] flex flex-col justify-center">
          {current.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5 pt-0 gap-3">
          {/* Back / Skip */}
          <div>
            {!isFirst ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] text-mute hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Назад
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="h-9 px-3 rounded-xl text-[12px] text-mute2 hover:text-mute transition-colors"
              >
                Пропустить
              </button>
            )}
          </div>

          {/* Next / Done */}
          {isLast ? (
            <button
              onClick={dismiss}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-brand hover:bg-brand-hover text-[#171821] text-[13.5px] font-semibold shadow-glow-lime transition-all"
            >
              Начать работу 🚀
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-[#171821] text-[13px] font-semibold shadow-glow-lime transition-all"
            >
              Далее <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Step counter */}
        <div className="absolute bottom-[22px] left-1/2 -translate-x-1/2 text-[10.5px] text-mute2 tabular-nums pointer-events-none">
          {step + 1} / {STEPS.length}
        </div>
      </div>
    </div>
  )
}
