'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, CheckSquare, Folder, BookOpen, Users, User, LayoutGrid,
  MessageSquare, Shield, Settings, LogOut, X, ChevronDown, Check, ShoppingBag,
} from 'lucide-react'
import { Logomark } from '@/components/ui/Logomark'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { ROLES, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'
import type { UserRole } from '@/types'

const NAV_ITEMS = [
  { key: 'dashboard',  label: 'Главная',     href: '/dashboard',  icon: Home },
  { key: 'tasks',      label: 'Задачи',      href: '/tasks',      icon: CheckSquare },
  { key: 'projects',   label: 'Проекты',     href: '/projects',   icon: Folder },
  { key: 'knowledge',  label: 'База знаний', href: '/knowledge',  icon: BookOpen },
  { key: 'crm',        label: 'CRM',         href: '/crm',        icon: Users },
  { key: 'employees',  label: 'Сотрудники',  href: '/employees',  icon: User },
  { key: 'services',   label: 'Сервисы',     href: '/services',   icon: LayoutGrid },
  { key: 'shop',       label: 'Магазин',     href: '/shop',       icon: ShoppingBag },
  { key: 'chats',      label: 'Чаты',        href: '/chats',      icon: MessageSquare },
  { key: 'management', label: 'Управление',  href: '/management', icon: Shield, ceoOnly: true },
  { key: 'profile',    label: 'Профиль',     href: '/profile',    icon: Settings },
]

interface SidebarProps {
  taskCount?: number
  chatCount?: number
}

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

  const items = NAV_ITEMS.filter(
    (item) => !item.ceoOnly || role === 'ceo'
  )

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
        className={`w-[240px] shrink-0 h-screen border-r border-line bg-sidebar flex flex-col z-40
          fixed top-0 left-0 lg:sticky lg:top-0 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <Logomark />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-md text-mute hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* User profile chip */}
        <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.025] border border-line flex items-center gap-3">
          <Avatar initials={initials} color="#1472F5" size={38} status={status} />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold tracking-tight truncate">
              {user?.full_name?.split(' ')[0] ?? 'Профиль'}
            </div>
            <div className="text-[11px] text-mute flex items-center gap-1.5 mt-0.5">
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

        {/* Role switcher (demo) */}
        <RoleSwitcher
          role={role}
          onRoleChange={(r) => {
            setRole(r)
            const found = ROLES.find((x) => x.id === r)
            addToast('Роль переключена', `Теперь ты — ${found?.label}`, 'accent')
          }}
        />

        {/* Navigation */}
        <div className="px-3 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.14em] text-mute2 px-3 mb-2 font-semibold">
            Меню
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              const badge = badges[item.key]

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`nav-item w-full flex items-center gap-3 px-3 h-10 rounded-lg text-[13.5px] font-medium tracking-tight
                    ${isActive ? 'nav-active text-white' : 'text-mute hover:text-white hover:bg-white/[0.03]'}`}
                >
                  <span className={isActive ? 'text-accent' : item.ceoOnly ? 'text-gold' : ''}>
                    <Icon size={18} />
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.ceoOnly && !isActive && (
                    <span className="text-[9px] text-gold/70 font-mono uppercase tracking-wider">
                      CEO
                    </span>
                  )}
                  {badge ? (
                    <span
                      className={`min-w-[20px] h-5 px-1.5 rounded-md inline-flex items-center justify-center text-[10.5px] font-semibold
                        ${isActive ? 'bg-accent text-white' : 'bg-white/[0.06] text-mute'}`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="px-3 pb-5 pt-3 border-t border-line">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-[11px] text-mute">
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'animate-pulse-dot' : ''}`}
                style={{ background: status === 'online' ? '#22C55E' : status === 'busy' ? '#F59E0B' : '#5A6188' }} />
              <span>{status === 'online' ? 'Онлайн' : status === 'busy' ? 'Занят' : 'Не в сети'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-[12px] text-mute hover:text-white"
            >
              <LogOut size={14} /> Выход
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

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
        className="w-full flex items-center gap-2 px-3 h-9 rounded-lg border border-line bg-white/[0.02] hover:bg-white/[0.04] text-[12px] text-mute hover:text-white"
      >
        <span className="text-[10px] uppercase tracking-[0.12em] text-mute2 font-semibold">
          Demo роль:
        </span>
        <span className="font-semibold flex items-center gap-1" style={{ color: current.color }}>
          {current.emoji} {current.label}
        </span>
        <ChevronDown size={12} className="ml-auto" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 py-1.5 rounded-lg bg-[#0E1330] border border-line2 shadow-2xl">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onRoleChange(r.id as UserRole)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 h-8 text-[12.5px] text-left hover:bg-white/[0.04]
                ${role === r.id ? 'text-white' : 'text-mute'}`}
            >
              <span>{r.emoji}</span>
              <span
                className="flex-1 font-medium"
                style={{ color: role === r.id ? r.color : undefined }}
              >
                {r.label}
              </span>
              {role === r.id && <Check size={12} className="text-accent" />}
            </button>
          ))}
          <div className="border-t border-line mt-1.5 pt-1.5 px-3 text-[10.5px] text-mute2">
            Для демонстрации UI разных ролей
          </div>
        </div>
      )}
    </div>
  )
}
