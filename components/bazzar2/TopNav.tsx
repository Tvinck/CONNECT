'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { B2_SECTIONS, b2Label } from './sections'
import { BazzarMark } from './BazzarMark'

/**
 * Верхняя навигация BazzarSerts 2.0 — заменяет левый сайдбар.
 * Ряд 1: переиспользуем Header (глобальный поиск, уведомления, профиль).
 * Ряд 2: горизонтальная навигация разделов (primary в основном ряду,
 *         non-primary в выпадающем меню «Ещё»).
 */
export function TopNav() {
  const pathname = usePathname()
  const active = pathname.split('/')[2] || 'overview' // /b2/<section>
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const primary = B2_SECTIONS.filter((s) => s.primary)
  const secondary = B2_SECTIONS.filter((s) => !s.primary)
  const isSecondaryActive = secondary.some((s) => s.key === active)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    if (moreOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  const linkCls = (on: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
      on ? 'bg-brand text-[#171821]' : 'text-mute hover:bg-black/[0.04] hover:text-[#171821]'
    }`

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-line">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        {/* Утилиты (поиск / уведомления / профиль) */}
        <div className="[&>header]:mb-0 flex items-center gap-3">
          <Link href="/" prefetch={false} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 -ml-2 rounded-lg text-mute hover:text-foreground hover:bg-black/[0.04] transition-colors text-[13px] font-medium" title="Назад в Connect">
            <ArrowLeft size={16} strokeWidth={2.2} />
          </Link>
          <Header title="BazzarSerts 2.0" subtitle={`Командный центр · ${b2Label(active)}`} />
        </div>

        {/* Ряд разделов: прокручиваются только primary-ссылки; «Ещё» — снаружи
            overflow-контейнера, чтобы выпадающее меню не обрезалось. */}
        <div className="flex items-center gap-1">
          <Link href="/b2/overview" prefetch={false} className="shrink-0 mr-1.5" title="BazzarSerts 2.0">
            <BazzarMark size={24} />
          </Link>

          {/* Primary разделы (скроллятся) */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2.5 flex-1 min-w-0" style={{ scrollbarWidth: 'none' }}>
            {primary.map((s) => {
              const on = active === s.key
              const Icon = s.icon
              return (
                <Link key={s.key} href={`/b2/${s.key}`} prefetch={false} className={linkCls(on)}>
                  <Icon size={15} strokeWidth={2.2} />
                  {s.label}
                </Link>
              )
            })}
          </nav>

          {/* «Ещё» — вне overflow, поэтому дропдаун виден полностью */}
          {secondary.length > 0 && (
            <div ref={moreRef} className="relative shrink-0 flex items-center py-2.5">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={linkCls(isSecondaryActive && !moreOpen)}
              >
                <MoreHorizontal size={15} strokeWidth={2.2} />
                Ещё
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-card border border-line rounded-xl shadow-xl py-1.5 min-w-[190px] z-50">
                  {secondary.map((s) => {
                    const on = active === s.key
                    const Icon = s.icon
                    return (
                      <Link
                        key={s.key}
                        href={`/b2/${s.key}`}
                        prefetch={false}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                          on
                            ? 'bg-brand/10 text-[#171821] font-semibold'
                            : 'text-mute hover:bg-black/[0.04] hover:text-[#171821]'
                        }`}
                      >
                        <Icon size={15} strokeWidth={2.2} />
                        {s.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
