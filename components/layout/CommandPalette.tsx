/**
 * components/layout/CommandPalette.tsx — Global quick-navigation (Ctrl/Cmd + K).
 *
 * Purely additive: opens a centered search overlay that filters the primary
 * navigation and jumps to a section on Enter. Nothing else in the app depends
 * on it, so it cannot regress existing screens.
 *
 * Keys:  ⌘K / Ctrl+K toggle · ↑ ↓ move · Enter open · Esc close
 *
 * Visibility mirrors the sidebar: CEO-only sections are hidden for non-CEOs.
 * (Full per-section permission filtering is handled separately alongside the
 * sidebar role-visibility work.)
 */

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CornerDownLeft } from 'lucide-react'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuthStore } from '@/store/auth'

export function CommandPalette() {
  const router = useRouter()
  const { role, permissions } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Items this user is allowed to see. Mirrors the sidebar exactly: CEO-only
  // items require the CEO role, and permission-gated items (those with a
  // `section`) are hidden unless the user has an explicit level > 0 for that
  // section — deny-by-default, matching verifyPagePermission.
  const allowed = useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (item.ceoOnly) return role === 'ceo'
        if (item.section && permissions) return (permissions[item.section] ?? 0) > 0
        return true
      }),
    [role, permissions]
  )

  // Filtered by the current query (case-insensitive substring on label/group).
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allowed
    return allowed.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    )
  }, [query, allowed])

  // Global hotkey to toggle the palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Reset + focus whenever it opens.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // Focus after the element paints.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Keep the highlighted row in range as results shrink.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)))
  }, [results.length])

  if (!open) return null

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (results.length ? (a + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[active]
      if (item) go(item.href)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="relative w-full max-w-[560px] bg-card border border-line rounded-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-pop-in"
      >
        {/* Search row */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
          <Search size={18} className="text-mute shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Перейти к разделу…"
            className="flex-1 bg-transparent text-[15px] text-slate-800 placeholder:text-mute outline-none"
          />
          <kbd className="text-[11px] text-mute2 border border-line rounded-lg px-1.5 py-0.5 font-mono shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[52vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-mute">
              Ничего не найдено
            </div>
          )}
          {results.map((item, i) => {
            const Icon = item.icon
            const isActive = i === active
            return (
              <button
                key={item.key}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-card-hover' : ''
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg border border-line inline-flex items-center justify-center shrink-0 ${
                    isActive ? 'text-accent' : 'text-mute'
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-medium text-slate-800 truncate">
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-mute2 truncate">{item.group}</span>
                </span>
                {isActive && (
                  <CornerDownLeft size={14} className="text-mute2 shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 h-9 border-t border-line text-[11px] text-mute2">
          <span className="flex items-center gap-1">
            <kbd className="border border-line rounded px-1 font-mono">↑</kbd>
            <kbd className="border border-line rounded px-1 font-mono">↓</kbd>
            навигация
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-line rounded px-1 font-mono">↵</kbd>
            открыть
          </span>
        </div>
      </div>
    </div>
  )
}
