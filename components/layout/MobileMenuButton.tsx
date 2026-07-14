'use client'

/**
 * MobileMenuButton — small hamburger that opens the app sidebar drawer.
 *
 * Used on pages that don't render the full <Header> (e.g. SkinScan's hero
 * layout, the full-height Chats screen). Hidden on desktop (lg:) where the
 * sidebar is always visible; only provides mobile navigation access.
 */

import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui'

export function MobileMenuButton({ className = '' }: { className?: string }) {
  const setSidebarOpen = useUIStore(s => s.setSidebarOpen)
  return (
    <button
      onClick={() => setSidebarOpen(true)}
      aria-label="Открыть меню"
      className={`lg:hidden w-10 h-10 rounded-xl border border-line bg-card text-mute hover:text-slate-800 hover:bg-card-hover inline-flex items-center justify-center shrink-0 transition-colors ${className}`}
    >
      <Menu size={18} />
    </button>
  )
}
