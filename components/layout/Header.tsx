'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import Link from 'next/link'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore()
  const { setSidebarOpen } = useUIStore()

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'АК'

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
            <p className="text-[13px] sm:text-[14px] text-mute mt-1.5 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search — desktop only */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute"
          />
          <input
            placeholder="Поиск задач, людей, проектов…"
            className="w-[200px] xl:w-[280px] h-10 pl-10 pr-3 bg-white/[0.025] border border-line rounded-xl text-[13px] placeholder:text-mute2 focus:border-accent focus:bg-white/[0.04] outline-none transition-all duration-200"
          />
        </div>

        {/* Search mobile */}
        <button className="md:hidden w-10 h-10 rounded-xl border border-line bg-white/[0.025] text-mute hover:text-white inline-flex items-center justify-center">
          <Search size={17} />
        </button>

        {/* Bell */}
        <button className="relative w-10 h-10 rounded-xl border border-line bg-white/[0.025] text-mute hover:text-white hover:border-line2 transition inline-flex items-center justify-center">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-err ring-2 ring-bg" />
        </button>

        {/* Avatar */}
        <Link href="/profile" className="hover:scale-105 transition-transform">
          <Avatar initials={initials} color="#1472F5" size={40} ring online />
        </Link>
      </div>
    </header>
  )
}
