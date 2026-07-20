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
import { Bell, Search, Menu, X, CheckCheck, CheckSquare, Folder, Loader2, Info, AlertTriangle, Trophy, BellRing, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { createClient } from '@/lib/supabase/client'
import { clearMyNotifications, markAllMyNotificationsRead } from '@/app/actions/notifications'
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

  // Request system notification permission on mount and subscribe to Web Push
  useEffect(() => {
    async function setupWebPush() {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') return

          const registration = await navigator.serviceWorker.register('/sw.js')
          await navigator.serviceWorker.ready

          let subscription = await registration.pushManager.getSubscription()
          if (!subscription) {
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidPublicKey) return

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey
            })
          }

          // Send to backend
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          })
        } catch (err) {
          console.error('Failed to setup Web Push:', err)
        }
      }
    }
    setupWebPush()
  }, [])

  // Helper for VAPID conversion
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

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
    // Через server-action (admin) — надёжно, минуя возможные пробелы RLS на UPDATE.
    await markAllMyNotificationsRead()
  }

  const clearAll = async () => {
    if (!user) return
    const prev = notifs
    setNotifs([])
    setShowNotifs(false)
    // Через server-action (admin): клиентский delete тихо блокировался RLS
    // (0 строк, без ошибки) — уведомления «возвращались» после переоткрытия.
    const res = await clearMyNotifications()
    if (!res.success) {
      setNotifs(prev)
      addToast('Ошибка', 'Не удалось очистить уведомления', 'err')
    }
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
          className="lg:hidden w-10 h-10 rounded-xl border border-line bg-card text-mute hover:text-slate-800 hover:bg-card-hover inline-flex items-center justify-center shrink-0 transition-colors"
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
            className="w-[200px] xl:w-[280px] h-10 pl-10 pr-8 bg-card border border-line rounded-xl text-[13px] text-slate-800 placeholder:text-mute focus:border-accent focus:bg-card-hover outline-none transition-all duration-200"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute2 hover:text-slate-800">
              <X size={14} />
            </button>
          )}

          {showResults && query.trim().length >= 2 && (
            <div className="absolute right-0 top-full mt-2 w-[320px] bg-card border border-line rounded-2xl shadow-2xl z-50 overflow-hidden animate-pop-in">
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
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-card-hover transition-all text-left border-b border-line/40 last:border-0">
                  {r.kind === 'user' ? (
                    <Avatar initials={getInitials(r.label)} color={colorFor(r.label)} size={30} />
                  ) : (
                    <div className="w-[30px] h-[30px] rounded-lg bg-bg border border-line inline-flex items-center justify-center text-mute shrink-0">
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
        <button className="md:hidden w-10 h-10 rounded-xl border border-line bg-card text-mute hover:text-slate-800 hover:bg-card-hover inline-flex items-center justify-center transition-colors">
          <Search size={17} />
        </button>

        {/* Bell + dropdown */}
        <div ref={bellRef} className="relative">
          <button
            onClick={toggleNotifs}
            className={`relative w-10 h-10 rounded-xl border transition inline-flex items-center justify-center ${
              showNotifs
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-line bg-card text-mute hover:text-slate-800 hover:bg-card-hover hover:border-line2'
            }`}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-err ring-2 ring-bg" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2.5 w-[380px] bg-[#161722]/95 backdrop-blur-xl text-white border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] z-50 overflow-hidden animate-pop-in">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-white tracking-tight">Уведомления</span>
                  {unread > 0 && (
                    <span className="h-5 px-2 rounded-full bg-accent/15 text-accent text-[11px] font-bold inline-flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {unread > 0 && (
                    <button onClick={markAllRead}
                      className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-semibold text-mute2 hover:text-[#BFF128] hover:bg-white/[0.04] transition-all">
                      <CheckCheck size={13} /> Прочитать все
                    </button>
                  )}
                  {notifs.length > 0 && (
                    <button onClick={clearAll}
                      className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-semibold text-mute2 hover:text-err hover:bg-white/[0.04] transition-all">
                      <Trash2 size={12} /> Очистить всё
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)}
                    className="w-7 h-7 rounded-lg text-mute2 hover:text-white hover:bg-white/[0.04] transition-all inline-flex items-center justify-center">
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04]">
                {loadingNotifs && (
                  <div className="flex flex-col items-center justify-center py-12 text-mute text-[13px] gap-2">
                    <Loader2 size={18} className="animate-spin text-accent" />
                    <span>Загрузка уведомлений…</span>
                  </div>
                )}
                {!loadingNotifs && notifs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-mute text-[13px] gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.04] inline-flex items-center justify-center text-mute2">
                      <Bell size={20} />
                    </div>
                    <span>Нет уведомлений</span>
                  </div>
                )}
                {!loadingNotifs && notifs.filter(n => n.title).map(n => {
                  const typeColors: Record<string, { border: string; iconBg: string; text: string }> = {
                    task: { border: 'border-l-2 border-l-ok', iconBg: 'bg-ok/10 border-ok/20', text: 'text-ok' },
                    ach: { border: 'border-l-2 border-l-gold', iconBg: 'bg-gold/10 border-gold/20', text: 'text-gold' },
                    alert: { border: 'border-l-2 border-l-err', iconBg: 'bg-err/10 border-err/20', text: 'text-err' },
                    info: { border: 'border-l-2 border-l-accent', iconBg: 'bg-accent/10 border-accent/20', text: 'text-accent' },
                  }
                  const design = typeColors[n.type] ?? typeColors.info

                  return (
                    <div key={n.id}
                      onClick={() => markRead(n.id, n.link)}
                      className={`flex gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-all relative group ${design.border} ${n.is_read ? 'opacity-50' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-xl border shrink-0 inline-flex items-center justify-center mt-0.5 ${design.iconBg}`}>
                        {NOTIF_ICON[n.type] ?? <BellRing size={16} className={design.text} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 justify-between">
                          <div className="text-[13px] font-bold text-white leading-snug truncate max-w-[200px]">
                            {n.title}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 mt-1">
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                            <span className="text-[10px] text-mute2 font-mono whitespace-nowrap">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-[12px] text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                          {n.body}
                        </div>
                      </div>
                    </div>
                  )
                })}
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
