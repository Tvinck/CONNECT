/**
 * components/layout/Sidebar.tsx — Left-side navigation sidebar.
 *
 * Responsibilities:
 *  - Full-height nav with all section links (filters CEO-only items by role).
 *  - Badge counts on Tasks and Chats passed in as props from the server layout.
 *  - User profile chip at the top showing first name, role pill, and status dot.
 *  - Demo role-switcher (RoleSwitcher) — lets any user preview the UI from
 *    another role's perspective without touching the database.
 *  - Mobile: rendered as a fixed drawer (z-40), opened by the Header hamburger.
 *    Semi-transparent backdrop closes it on click.
 *  - Logout button signs out via Supabase, clears the auth store, and redirects
 *    to /login.
 */

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, CheckSquare, Folder, BookOpen, Users, User, LayoutGrid,
  MessageSquare, Shield, Settings, LogOut, X, ChevronDown, Check, ShoppingBag,
  Wallet, Gift, HeadphonesIcon, Lightbulb, Newspaper,
} from 'lucide-react'
import { Logomark } from '@/components/ui/Logomark'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { ROLES, getInitials, colorFor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'
import type { UserRole } from '@/types'

const NAV_GROUPS = [
  {
    label: 'Работа',
    items: [
      { key: 'dashboard', label: 'Главная',     href: '/dashboard', icon: Home },
      { key: 'news',      label: 'Новости',     href: '/news',      icon: Newspaper },
      { key: 'tasks',     label: 'Задачи',      href: '/tasks',     icon: CheckSquare },
      { key: 'projects',  label: 'Проекты',     href: '/projects',  icon: Folder },
      { key: 'knowledge', label: 'База знаний', href: '/knowledge', icon: BookOpen },
      { key: 'ideas',     label: 'Идеи',        href: '/ideas',     icon: Lightbulb },
    ],
  },
  {
    label: 'Бизнес',
    items: [
      { key: 'finances', label: 'Финансы',      href: '/finances',  icon: Wallet },
      { key: 'pm',       label: 'ПодариМомент', href: '/pm',        icon: Gift },
      { key: 'crm',      label: 'CRM',          href: '/crm',       icon: Users },
      { key: 'services', label: 'Сервисы',      href: '/services',  icon: LayoutGrid },
      { key: 'shop',     label: 'Магазин',      href: '/shop',      icon: ShoppingBag },
      { key: 'support',  label: 'Поддержка',    href: '/support',   icon: HeadphonesIcon },
    ],
  },
  {
    label: 'Команда',
    items: [
      { key: 'employees', label: 'Сотрудники', href: '/employees', icon: User },
      { key: 'chats',     label: 'Чаты',       href: '/chats',     icon: MessageSquare },
    ],
  },
  {
    label: 'Управление',
    items: [
      { key: 'management', label: 'Управление', href: '/management', icon: Shield, ceoOnly: true },
      { key: 'profile',    label: 'Профиль',    href: '/profile',    icon: Settings },
    ],
  },
] as const

/**
 * Свойства для компонента Sidebar
 * @interface SidebarProps
 * @property {number} [taskCount] - Количество непрочитанных/активных задач
 * @property {number} [chatCount] - Количество новых сообщений в чатах
 */
interface SidebarProps {
  taskCount?: number
  chatCount?: number
}

/**
 * Боковая панель навигации (Sidebar).
 * Содержит ссылки на все разделы платформы `connect`.
 * Учитывает роль пользователя (некоторые пункты видны только CEO).
 * Поддерживает мобильный (выдвижной) и десктопный виды.
 * 
 * @param {SidebarProps} props - Свойства компонента.
 * @returns {JSX.Element} Отрендеренная боковая панель.
 */
export function Sidebar({ taskCount = 0, chatCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { role, setRole, user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, addToast } = useUIStore()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
    router.push('/login')
    router.refresh()
  }

  const initials = getInitials(user?.full_name)
  const status = user?.status ?? 'offline'

  const roleMeta = ROLES.find((r) => r.id === role) || ROLES[0]

  const badges: Record<string, number> = {
    tasks: taskCount,
    chats: chatCount,
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 backdrop-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-[240px] shrink-0 h-screen border-r border-white/[0.04] bg-[#13141C] text-white flex flex-col z-40
          fixed top-0 left-0 lg:sticky lg:top-0 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <Logomark className="drop-shadow-[0_0_8px_rgba(191,241,40,0.18)] text-white" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-md text-[#8E92BC] hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* User profile chip */}
        <div className="mx-3 mb-4 p-3 rounded-xl bg-[#1C1D2A] border border-white/[0.04] flex items-center gap-3">
          <Avatar initials={initials} color={colorFor(user?.full_name ?? '')} size={38} status={status} />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold tracking-tight truncate text-white">
              {user?.full_name?.split(' ')[0] ?? 'Профиль'}
            </div>
            <div className="text-[11px] text-[#8E92BC] flex items-center gap-1.5 mt-0.5">
              <span
                className="px-1.5 h-4 rounded text-[10px] font-semibold inline-flex items-center"
                style={{
                  background: `${roleMeta.color}26`,
                  color: roleMeta.color,
                }}
              >
                {roleMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Role switcher (demo) - visible only to actual CEOs */}
        {user?.role === 'ceo' && (
          <RoleSwitcher
            role={role}
            onRoleChange={(r) => {
              setRole(r)
              const found = ROLES.find((x) => x.id === r)
              addToast('Роль переключена', `Теперь ты — ${found?.label}`, 'accent')
            }}
          />
        )}

        {/* Navigation */}
        <div className="px-3 flex-1 overflow-y-auto space-y-4">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !('ceoOnly' in item && item.ceoOnly) || role === 'ceo'
            )
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <div className="text-[10px] uppercase tracking-[0.14em] text-[#5A5D7F] px-3 mb-1.5 font-bold">
                  {group.label}
                </div>
                <nav className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)
                    const badge = badges[item.key as keyof typeof badges]
                    const isCeoOnly = 'ceoOnly' in item && item.ceoOnly

                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`nav-item w-full flex items-center gap-3 px-3 h-10 rounded-[12px] text-[13px] font-semibold tracking-tight transition-all duration-150
                          ${isActive 
                            ? 'bg-[#BFF128] text-black font-extrabold shadow-[0_2px_8px_rgba(191,241,40,0.12)]' 
                            : 'text-[#8E92BC] hover:text-white hover:bg-white/[0.03]'}`}
                      >
                        <span className={isActive ? 'text-black' : isCeoOnly ? 'text-gold' : ''}>
                          <Icon size={17} />
                        </span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {isCeoOnly && !isActive && (
                          <span className="text-[9px] text-gold/70 font-mono uppercase tracking-wider">
                            CEO
                          </span>
                        )}
                        {item.key === 'ideas' && (
                          <span className="px-1.5 py-0.5 rounded border border-[#BFF128]/40 bg-[#BFF128]/10 text-[#BFF128] text-[8.5px] font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(191,241,40,0.2)]">
                            Новое
                          </span>
                        )}
                        {badge ? (
                          <span
                            className={`min-w-[20px] h-5 px-1.5 rounded-md inline-flex items-center justify-center text-[10.5px] font-bold
                               ${isActive ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E92BC]'}`}
                          >
                            {badge}
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-3 pb-5 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-[11px] text-[#8E92BC]">
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'animate-pulse-dot' : ''}`}
                style={{ background: status === 'online' ? '#22C55E' : status === 'busy' ? '#F59E0B' : '#5A6188' }} />
              <span>{status === 'online' ? 'Онлайн' : status === 'busy' ? 'Занят' : 'Не в сети'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-[#8E92BC] hover:text-white transition-colors"
            >
              <LogOut size={14} /> Выход
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

/**
 * Демонстрационный компонент для быстрого переключения ролей.
 * Виден только пользователю с фактической ролью 'ceo'.
 * 
 * @param {Object} props - Свойства
 * @param {UserRole} props.role - Текущая выбранная роль
 * @param {function} props.onRoleChange - Коллбек при смене роли
 * @returns {JSX.Element} Выпадающий список выбора роли
 */
function RoleSwitcher({
  role,
  onRoleChange,
}: {
  role: UserRole
  onRoleChange: (r: UserRole) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = ROLES.find((r) => r.id === role) || ROLES[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="mx-3 mb-4 relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 h-9 rounded-lg border border-white/[0.05] bg-[#1C1D2A] hover:bg-white/[0.04] text-[12px] text-[#8E92BC] hover:text-white transition-all"
      >
        <span className="text-[10px] uppercase tracking-[0.12em] text-[#5A5D7F] font-semibold">
          Demo роль:
        </span>
        <span className="font-semibold flex items-center gap-1" style={{ color: current.color }}>
          {current.emoji} {current.label}
        </span>
        <ChevronDown size={12} className="ml-auto text-[#8E92BC]" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 py-1.5 rounded-lg bg-[#1C1D2A] border border-white/[0.08] shadow-2xl">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onRoleChange(r.id as UserRole)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 h-8 text-[12.5px] text-left hover:bg-white/[0.04] transition-colors
                ${role === r.id ? 'text-white' : 'text-[#8E92BC]'}`}
            >
              <span>{r.emoji}</span>
              <span
                className="flex-1 font-medium"
                style={{ color: role === r.id ? r.color : undefined }}
              >
                {r.label}
              </span>
              {role === r.id && <Check size={12} className="text-[#BFF128]" />}
            </button>
          ))}
          <div className="border-t border-white/[0.04] mt-1.5 pt-1.5 px-3 text-[10.5px] text-[#5A5D7F]">
            Для демонстрации UI разных ролей
          </div>
        </div>
      )}
    </div>
  )
}
