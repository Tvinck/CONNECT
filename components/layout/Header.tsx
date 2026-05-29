'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Search, Menu, X, CheckCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import Link from 'next/link'
import type { Notification } from '@/types'

const NOTIF_ICON: Record<string, string> = {
  task: '✅', ach: '🏆', alert: '⚠️', info: 'ℹ️',
}

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore()
  const { setSidebarOpen } = useUIStore()
  const supabase = createClient()

  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'АК'

  const unread = notifs.filter(n => !n.is_read).length

  const fetchNotifs = async () => {
    if (!user) return
    setLoadingNotifs(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs(data ?? [])
    setLoadingNotifs(false)
  }

  const toggleNotifs = async () => {
    if (!showNotifs) await fetchNotifs()
    setShowNotifs(v => !v)
  }

  const markRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllRead = async () => {
    if (!user) return
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowNotifs(false)
    }
    if (showNotifs) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifs])

  // Prefetch unread count on mount
  useEffect(() => {
    if (!user) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => {
        if ((count ?? 0) > 0) {
          // Just to show red dot — we don't need to fetch full list yet
          setNotifs(Array.from({ length: count! }, (_, i) => ({
            id: `placeholder-${i}`, user_id: user.id, type: 'info',
            title: '', body: '', is_read: false, created_at: new Date().toISOString(),
          })))
        }
      })
  }, [user?.id])

  return (
    <header className="flex items-center justify-between mb-7 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-10 h-10 rounded-xl border border-line bg-white/[0.025] text-mute hover:text-white inline-flex items-center justify-center shrink-0"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] sm:text-[14px] text-mute mt-1.5 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search desktop */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
          <input
            placeholder="Поиск задач, людей, проектов…"
            className="w-[200px] xl:w-[280px] h-10 pl-10 pr-3 bg-white/[0.025] border border-line rounded-xl text-[13px] placeholder:text-mute2 focus:border-accent focus:bg-white/[0.04] outline-none transition-all duration-200"
          />
        </div>

        {/* Search mobile */}
        <button className="md:hidden w-10 h-10 rounded-xl border border-line bg-white/[0.025] text-mute hover:text-white inline-flex items-center justify-center">
          <Search size={17} />
        </button>

        {/* Bell + dropdown */}
        <div ref={bellRef} className="relative">
          <button
            onClick={toggleNotifs}
            className={`relative w-10 h-10 rounded-xl border transition inline-flex items-center justify-center ${
              showNotifs
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-line bg-white/[0.025] text-mute hover:text-white hover:border-line2'
            }`}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-err ring-2 ring-bg" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-[340px] bg-[#151829] border border-line rounded-2xl shadow-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold tracking-tight">Уведомления</span>
                  {unread > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-err/15 text-err text-[11px] font-bold inline-flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <button onClick={markAllRead}
                      className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11.5px] text-mute hover:text-white hover:bg-white/[0.04] transition-all">
                      <CheckCheck size={12} /> Прочитать все
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)}
                    className="w-7 h-7 rounded-lg text-mute hover:text-white hover:bg-white/[0.04] transition-all inline-flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[400px] overflow-y-auto">
                {loadingNotifs && (
                  <div className="text-center py-6 text-mute text-[13px]">Загрузка…</div>
                )}
                {!loadingNotifs && notifs.length === 0 && (
                  <div className="text-center py-8 text-mute text-[13px]">Нет уведомлений</div>
                )}
                {!loadingNotifs && notifs.filter(n => n.title).map(n => (
                  <div key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex gap-3 px-4 py-3.5 border-b border-line/40 last:border-0 cursor-pointer hover:bg-white/[0.03] transition-all ${n.is_read ? 'opacity-55' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-line shrink-0 inline-flex items-center justify-center text-lg mt-0.5">
                      {NOTIF_ICON[n.type] ?? 'ℹ️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="text-[13px] font-medium leading-snug flex-1">{n.title}</div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                      </div>
                      <div className="text-[12px] text-mute mt-0.5 line-clamp-2">{n.body}</div>
                      <div className="text-[11px] text-mute2 mt-1 font-mono">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar link to profile */}
        <Link href="/profile" className="hover:scale-105 transition-transform">
          <Avatar initials={initials} color="#1472F5" size={40} ring online />
        </Link>
      </div>
    </header>
  )
}
