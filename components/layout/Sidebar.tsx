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
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, X, ChevronDown, Check, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_GROUPS } from '@/components/layout/nav-config'
import { Logomark } from '@/components/ui/Logomark'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { ROLES, getInitials, colorFor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'
import type { UserRole } from '@/types'

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
  const { role, setRole, user, logout, permissions } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, addToast, sidebarCollapsed, setSidebarCollapsed, toggleSidebarCollapsed } = useUIStore()
  const [newsCount, setNewsCount] = useState(0)

  // Hydrate collapsed preference from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    if (localStorage.getItem('sidebar_collapsed') === '1') {
      setSidebarCollapsed(true)
    }
  }, [setSidebarCollapsed])

  const collapsed = sidebarCollapsed

  useEffect(() => {
    if (!user) return
    const fetchNewsCount = async () => {
      const supabase = createClient()
      // Получаем общее количество новостей
      const { count: totalNews } = await supabase.from('news').select('*', { count: 'exact', head: true })
      
      // Получаем количество прочитанных этим пользователем
      const { count: readNews } = await supabase.from('news_reads').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      
      if (totalNews !== null && readNews !== null) {
        setNewsCount(Math.max(0, totalNews - readNews))
      }
    }
    fetchNewsCount()

    // Подписываемся на обновления
    const supabase = createClient()
    const channel = supabase.channel('news_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, fetchNewsCount)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_reads', filter: `user_id=eq.${user.id}` }, fetchNewsCount)
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [user])

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
    news: newsCount,
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
        className={`w-[240px] ${collapsed ? 'lg:w-[76px]' : 'lg:w-[240px]'} shrink-0 h-screen border-r border-white/[0.04] bg-[#13141C] text-white flex flex-col z-40
          fixed top-0 left-0 lg:sticky lg:top-0 transition-[transform,width] duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className={`pt-6 pb-5 flex items-center ${collapsed ? 'px-5 lg:px-0 lg:justify-center' : 'px-5 justify-between'}`}>
          <Logomark className={`drop-shadow-[0_0_8px_rgba(191,241,40,0.18)] text-white ${collapsed ? 'lg:hidden' : ''}`} />
          <div className="flex items-center gap-1">
            {/* Desktop collapse toggle */}
            <button
              onClick={toggleSidebarCollapsed}
              title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
              className="hidden lg:inline-flex w-8 h-8 rounded-lg text-[#8E92BC] hover:text-white hover:bg-white/[0.05] items-center justify-center"
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            {/* Mobile close */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-lg text-[#8E92BC] hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* User profile chip */}
        <div className={`mx-3 mb-4 p-3 rounded-xl bg-[#1C1D2A] border border-white/[0.04] flex items-center gap-3 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
          <Avatar initials={initials} color={colorFor(user?.full_name ?? '')} size={38} status={status} />
          <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
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



        {/* Navigation */}
        <div className="px-3 flex-1 overflow-y-auto space-y-4">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if ('ceoOnly' in item && item.ceoOnly) {
                return role === 'ceo'
              }
              // Permission-gated items are hidden unless the user has an
              // explicit level > 0 for that section. Deny-by-default (?? 0)
              // mirrors verifyPagePermission so the sidebar never shows a link
              // that would just redirect. Ungated items (no `section`) always show.
              if (item.section && permissions) {
                const level = permissions[item.section] ?? 0
                return level > 0
              }
              return true
            })
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <div className={`text-[10px] uppercase tracking-[0.14em] text-[#5A5D7F] px-3 mb-1.5 font-bold ${collapsed ? 'lg:hidden' : ''}`}>
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
                        title={collapsed ? item.label : undefined}
                        className={`relative nav-item w-full flex items-center gap-3 h-10 rounded-xl text-[13px] font-semibold tracking-tight transition-all duration-150 group ${collapsed ? 'px-3 lg:px-0 lg:justify-center' : 'px-3'}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="active-sidebar-nav"
                            className="absolute inset-0 bg-[#BFF128] rounded-xl shadow-[0_2px_8px_rgba(191,241,40,0.12)]"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className={`relative z-10 ${isActive ? 'text-black font-extrabold' : isCeoOnly ? 'text-gold' : 'text-[#8E92BC] group-hover:text-white'}`}>
                          <Icon size={17} />
                        </span>
                        <span className={`relative z-10 flex-1 text-left ${collapsed ? 'lg:hidden' : ''} ${isActive ? 'text-black font-extrabold' : 'text-[#8E92BC] group-hover:text-white'}`}>
                          {item.label}
                        </span>
                        {isCeoOnly && !isActive && (
                          <span className={`relative z-10 text-[9px] text-gold/70 font-mono uppercase tracking-wider ${collapsed ? 'lg:hidden' : ''}`}>
                            CEO
                          </span>
                        )}
                        {item.key === 'ideas' && (
                          <span className={`relative z-10 px-1.5 py-0.5 rounded border border-[#BFF128]/40 bg-[#BFF128]/10 text-[#BFF128] text-[8.5px] font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(191,241,40,0.2)] ${collapsed ? 'lg:hidden' : ''}`}>
                            Новое
                          </span>
                        )}
                        {badge ? (
                          <>
                            <span
                              className={`relative z-10 min-w-[20px] h-5 px-1.5 rounded-lg inline-flex items-center justify-center text-[10.5px] font-bold ${collapsed ? 'lg:hidden' : ''}
                                 ${isActive ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E92BC]'}`}
                            >
                              {badge}
                            </span>
                            {/* Collapsed rail: show a dot instead of the count */}
                            {collapsed && (
                              <span className="hidden lg:block absolute top-1 right-1 z-10 w-2 h-2 rounded-full bg-[#BFF128] ring-2 ring-[#13141C]" />
                            )}
                          </>
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
          <div className={`flex items-center px-1 ${collapsed ? 'lg:flex-col lg:gap-3' : 'justify-between'}`}>
            <div className={`flex items-center gap-2 text-[11px] text-[#8E92BC] ${collapsed ? 'lg:justify-center' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'animate-pulse-dot' : ''}`}
                style={{ background: status === 'online' ? '#22C55E' : status === 'busy' ? '#F59E0B' : '#5A6188' }} />
              <span className={collapsed ? 'lg:hidden' : ''}>{status === 'online' ? 'Онлайн' : status === 'busy' ? 'Занят' : 'Не в сети'}</span>
            </div>
            <button
              onClick={handleLogout}
              title={collapsed ? 'Выход' : undefined}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-[#8E92BC] hover:text-white transition-colors"
            >
              <LogOut size={14} /> <span className={collapsed ? 'lg:hidden' : ''}>Выход</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

