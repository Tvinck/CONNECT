'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { UserProfileModal } from '@/components/profile/UserProfileModal'
import { createClient } from '@/lib/supabase/client'
import { getInitials, colorFor, levelInfo, timeAgo } from '@/lib/utils'
import type { User } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  online: '#22C55E', busy: '#F59E0B', offline: '#5A6188',
}
const STATUS_LABEL: Record<string, string> = {
  online: 'Онлайн', busy: 'На встрече', offline: 'Не в сети',
}
const ROLE_LABEL: Record<string, string> = {
  ceo: 'CEO', coowner: 'Совладелец', design: 'Дизайнер', dev: 'Разработка', sales: 'Продажи', support: 'Поддержка',
}

type Emp = User & { tasks_done?: number }

export function EmployeesClient({ employees: initialEmployees }: { employees: Emp[] }) {
  const router = useRouter()
  const [viewId, setViewId] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Emp[]>(initialEmployees)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('employees_presence')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        setEmployees(prev => prev.map(e => {
          if (e.id === payload.new.id) {
            return { ...e, last_seen: payload.new.last_seen, status: payload.new.status }
          }
          return e
        }))
      })
      .subscribe()
      
    // Force re-render every minute to update the "timeAgo" text
    const timer = setInterval(() => {
      setEmployees(prev => [...prev])
    }, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {employees.map(e => {
          const lvl = levelInfo(e.points)
          
          // Вычисляем реальный статус на основе last_seen
          const lastSeenMs = e.last_seen ? new Date(e.last_seen).getTime() : 0
          const isOnlineNow = e.last_seen && (Date.now() - lastSeenMs < 2 * 60 * 1000)
          
          // Если прошло меньше 2 минут, считаем онлайн. Иначе - офлайн.
          const currentStatus = isOnlineNow ? 'online' : 'offline'
          const statusText = isOnlineNow ? 'Онлайн' : (e.last_seen ? `Был(а) ${timeAgo(e.last_seen)}` : 'Не в сети')
          
          return (
            <div key={e.id} onClick={() => setViewId(e.id)}
              className="card p-5 cursor-pointer lift">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={getInitials(e.full_name)} color={colorFor(e.full_name)} size={44} status={currentStatus} />
                  <div>
                    <div className="text-[14.5px] font-bold tracking-tight">{e.full_name}</div>
                    <div className="text-[12px] text-mute">{e.position ?? ROLE_LABEL[e.role] ?? e.role}</div>
                  </div>
                </div>
                <button
                  onClick={ev => { ev.stopPropagation(); router.push('/chats') }}
                  className="w-8 h-8 rounded-lg border border-line bg-white/[0.02] hover:bg-accent/15 hover:text-accent hover:border-accent/30 text-mute inline-flex items-center justify-center transition-all">
                  <MessageSquare size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line">
                <div className="text-center">
                  <div className="text-[18px] font-bold tabular-nums" style={{ color: colorFor(e.full_name) }}>{e.points}</div>
                  <div className="text-[10.5px] text-mute2 mt-0.5">баллов</div>
                </div>
                <div className="text-center">
                  <div className="text-[18px] font-bold tabular-nums">{e.tasks_done ?? 0}</div>
                  <div className="text-[10.5px] text-mute2 mt-0.5">задач</div>
                </div>
                <div className="text-right">
                  <div className="text-[12.5px] font-semibold">{lvl.current.name}</div>
                  <div className="text-[11px] text-mute mt-0.5 inline-flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[currentStatus] }} />
                    {statusText}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {viewId && <UserProfileModal userId={viewId} onClose={() => setViewId(null)} />}
    </>
  )
}
