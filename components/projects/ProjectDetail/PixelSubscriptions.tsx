'use client'

import { useState, useMemo } from 'react'
import { Calendar, Users, ShieldCheck, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { getInitials, colorFor } from '@/lib/utils'

interface PixelSubscriptionsProps {
  initialSubscriptions: any[]
}

export function PixelSubscriptions({ initialSubscriptions }: PixelSubscriptionsProps) {
  const [subs] = useState<any[]>(initialSubscriptions)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredSubs = useMemo(() => {
    return subs.filter(s => {
      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && s.status !== 'active') return false
        if (filterStatus === 'expired' && s.status === 'active') return false
      }
      
      // Search query
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const username = s.user?.username || ''
      const firstName = s.user?.first_name || ''
      const plan = s.plan_id || s.plan_key || ''
      return (
        username.toLowerCase().includes(q) ||
        firstName.toLowerCase().includes(q) ||
        plan.toLowerCase().includes(q)
      )
    })
  }, [subs, filterStatus, searchQuery])

  const stats = useMemo(() => {
    const active = subs.filter(s => s.status === 'active').length
    const total = subs.length
    return { active, total }
  }, [subs])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-[16px] font-semibold">Активные подписки пользователей</h3>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-line bg-white/[0.02] text-[12.5px] text-mute hover:text-white transition-all outline-none"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="expired">Истекшие</option>
          </select>
          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по пользователю/плану..."
              className="h-8 pl-8 pr-3 rounded-lg border border-line bg-bg/50 text-[12px] outline-none w-52 focus:border-accent/60 transition-all"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-mute2" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-white/[0.015] border border-line p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-mute2 uppercase tracking-[0.05em] font-semibold mb-1">Активные подписки</div>
            <div className="text-[18px] font-black text-ok font-mono">{stats.active}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-ok/10 flex items-center justify-center text-ok">
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.015] border border-line p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-mute2 uppercase tracking-[0.05em] font-semibold mb-1">Всего подписчиков</div>
            <div className="text-[18px] font-black text-white font-mono">{stats.total}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-mute2">
            <Users size={16} />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-line text-mute2 uppercase tracking-wider text-[11px] font-bold">
              <th className="pb-3 pr-4">Пользователь</th>
              <th className="pb-3 px-4">Тарифный план</th>
              <th className="pb-3 px-4">Статус</th>
              <th className="pb-3 px-4">Активировано</th>
              <th className="pb-3 pl-4 text-right">Истекает</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/30">
            {filteredSubs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-mute">
                  Подписок не найдено
                </td>
              </tr>
            ) : (
              filteredSubs.map(s => {
                const isActive = s.status === 'active'
                const planName = s.plan_id || s.plan_key || 'Premium Access'
                
                return (
                  <tr key={s.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3.5 pr-4 font-semibold flex items-center gap-2">
                      <Avatar
                        initials={getInitials(s.user?.first_name || s.user?.username || 'User')}
                        color={colorFor(s.user?.username || s.user?.first_name || s.user_id)}
                        size={24}
                        src={s.user?.avatar_url}
                      />
                      <span className="truncate">
                        {s.user?.first_name || 'Пользователь'}
                        {s.user?.username && <span className="text-[11px] text-mute2 font-normal ml-1">@{s.user.username}</span>}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono text-[12.5px]">
                      {planName}
                    </td>
                    <td className="py-3.5 px-4">
                      <Tag tone={isActive ? 'ok' : 'mute'}>
                        {isActive ? 'Активна' : 'Истекла'}
                      </Tag>
                    </td>
                    <td className="py-3.5 px-4 text-mute2 font-mono text-[12px]">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-mute font-mono text-[12px]">
                      {s.expires_at ? new Date(s.expires_at).toLocaleDateString('ru-RU') : 'Бессрочно'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
