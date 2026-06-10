/**
 * components/layout/Header.tsx — Top navigation bar rendered on every dashboard page.
 *
 * Responsibilities:
 *  - Page title and optional subtitle (passed as props by each page).
 *  - Hamburger button that opens the mobile sidebar drawer.
 *  - Global search: debounced 250 ms, queries users / tasks / projects in parallel.
 *    Grouped dropdown navigates to the relevant section on click.
 *  - Bell button with unread notification badge, opens a dropdown list.
 *    Supports per-notification mark-as-read and "mark all read".
 *  - Avatar link to the profile page, shows real online/busy/offline status dot.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Menu, X, CheckCheck, CheckSquare, Folder, Loader2, Info, AlertTriangle, Trophy, BellRing } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { createClient } from '@/lib/supabase/client'
import { timeAgo, getInitials, colorFor } from '@/lib/utils'
import Link from 'next/link'
import type { Notification } from '@/types'

type SearchResult =
  | { kind: 'user';    id: string; label: string; sub: string }
  | { kind: 'task';    id: string; label: string; sub: string }
  | { kind: 'project'; id: string; label: string; sub: string }

const NOTIF_ICON: Record<string, React.ReactNode> = {
  task: <CheckSquare size={18} className="text-ok" />,
  ach: <Trophy size={18} className="text-gold" />,
  alert: <AlertTriangle size={18} className="text-err" />,
  info: <BellRing size={18} className="text-accent" />,
}

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore()
  const { setSidebarOpen, addToast } = useUIStore()
  const supabase = createClient()
  const router = useRouter()

  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  // Global search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Request system notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Subscribe to real-time notifications for the current user
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          if (!newNotif || !newNotif.title) return

          // 1. Add to local notifications list
          setNotifs((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev
            return [newNotif, ...prev]
          })

          // 2. Show in-app glassmorphic toast
          let tone: 'ok' | 'err' | 'warn' | 'accent' = 'accent'
          if (newNotif.type === 'task') tone = 'ok'
          else if (newNotif.type === 'alert') tone = 'warn'
          else if (newNotif.type === 'ach') tone = 'accent'

          addToast(newNotif.title, newNotif.body || undefined, tone)

          // 3. Show Browser system notification if the tab is not focused
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.visibilityState !== 'visible'
          ) {
            try {
              new Notification(newNotif.title, {
                body: newNotif.body || undefined,
                icon: '/favicon.ico',
              })
            } catch (err) {
              console.error('Failed to trigger system notification:', err)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, addToast])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); setSearching(false); return }
    setSearching(true)
    const handle = setTimeout(async () => {
      const like = `%${q}%`
      const [users, tasks, projects] = await Promise.all([
        supabase.from('users').select('id, full_name, position, role').ilike('full_name', like).limit(4),
        supabase.from('tasks').select('id, title, status').ilike('title', like).limit(4),
        supabase.from('projects').select('id, name, status').ilike('name', like).limit(4),
      ])
      const merged: SearchResult[] = [
        ...(users.data ?? []).map((u: any) => ({ kind: 'user' as const, id: u.id, label: u.full_name, sub: u.position ?? u.role })),
        ...(tasks.data ?? []).map((t: any) => ({ kind: 'task' as const, id: t.id, label: t.title, sub: 'Задача' })),
        ...(projects.data ?? []).map((p: any) => ({ kind: 'project' as const, id: p.id, label: p.name, sub: 'Проект' })),
      ]
      setResults(merged)
      setSearching(false)
    }, 250)
    return () => clearTimeout(handle)
  }, [query, supabase])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const goToResult = (r: SearchResult) => {
    setShowResults(false)
    setQuery('')
    if (r.kind === 'user') router.push('/employees')
    else if (r.kind === 'task') router.push('/tasks')
    else router.push('/projects')
  }

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

  const markRead = async (id: string, link?: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (link) {
      router.push(link)
      setShowNotifs(false)
    }
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
    if (!user?.id) return
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
  }, [user?.id, supabase])

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
        <div ref={searchRef} className="relative hidden md:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            placeholder="Поиск задач, людей, проектов…"
            className="w-[200px] xl:w-[280px] h-10 pl-10 pr-8 bg-white/[0.025] border border-line rounded-xl text-[13px] placeholder:text-mute2 focus:border-accent focus:bg-white/[0.04] outline-none transition-all duration-200"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute2 hover:text-white">
              <X size={14} />
            </button>
          )}

          {showResults && query.trim().length >= 2 && (
            <div className="absolute right-0 top-full mt-2 w-[320px] bg-[#151829] border border-line rounded-2xl shadow-2xl z-50 overflow-hidden animate-pop-in">
              {searching && (
                <div className="flex items-center justify-center gap-2 py-6 text-mute text-[13px]">
                  <Loader2 size={14} className="animate-spin" /> Поиск…
                </div>
              )}
              {!searching && results.length === 0 && (
                <div className="text-center py-6 text-mute text-[13px]">Ничего не найдено</div>
              )}
              {!searching && results.map(r => (
                <button key={`${r.kind}-${r.id}`} onClick={() => goToResult(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-all text-left border-b border-line/40 last:border-0">
                  {r.kind === 'user' ? (
                    <Avatar initials={getInitials(r.label)} color={colorFor(r.label)} size={30} />
                  ) : (
                    <div className="w-[30px] h-[30px] rounded-lg bg-white/[0.05] border border-line inline-flex items-center justify-center text-mute shrink-0">
                      {r.kind === 'task' ? <CheckSquare size={14} /> : <Folder size={14} />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{r.label}</div>
                    <div className="text-[11px] text-mute2 truncate capitalize">{r.sub}</div>
                  </div>
                  <span className="text-[10px] text-mute2 uppercase tracking-wider shrink-0">
                    {r.kind === 'user' ? 'Человек' : r.kind === 'task' ? 'Задача' : 'Проект'}
                  </span>
                </button>
              ))}
            </div>
          )}
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
            <div className="absolute right-0 top-full mt-2 w-[340px] bg-[#151829] text-white border border-line rounded-2xl shadow-2xl z-50 overflow-hidden">
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
                    onClick={() => markRead(n.id, n.link)}
                    className={`flex gap-3 px-4 py-3.5 border-b border-line/40 last:border-0 cursor-pointer hover:bg-white/[0.03] transition-all ${n.is_read ? 'opacity-55' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-line shrink-0 inline-flex items-center justify-center mt-0.5">
                      {NOTIF_ICON[n.type] ?? <BellRing size={18} className="text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="text-[13px] font-semibold text-white leading-snug flex-1">{n.title}</div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                      </div>
                      <div className="text-[12px] text-gray-300 mt-0.5 line-clamp-2">{n.body}</div>
                      <div className="text-[11px] text-mute2 mt-1.5 font-mono">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar link to profile */}
        <Link href="/profile" className="hover:scale-105 transition-transform">
          <Avatar initials={initials} color="#1472F5" size={40} ring status={user?.status ?? 'offline'} />
        </Link>
      </div>
    </header>
  )
}
