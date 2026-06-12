'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { colorFor, getInitials, levelInfo, timeAgo } from '@/lib/utils'
import type { User } from '@/types'
import { useRouter } from 'next/navigation'

interface AchRow { id: string; title: string; icon: string; description: string; points: number }

const STATUS_COLOR: Record<string, string> = {
  online: '#22C55E', busy: '#F59E0B', offline: '#5A6188',
}
const STATUS_LABEL: Record<string, string> = {
  online: 'Онлайн', busy: 'Занят', offline: 'Не в сети',
}
const ROLE_LABEL: Record<string, string> = {
  ceo: 'CEO', coowner: 'Совладелец', design: 'Дизайнер', dev: 'Разработка', sales: 'Продажи', support: 'Поддержка',
}

export function UserProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tasksDone, setTasksDone] = useState(0)
  const [achs, setAchs] = useState<AchRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      const [{ data: u }, { count }, { data: earned }] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single<User>(),
        supabase.from('tasks').select('id', { count: 'exact', head: true })
          .eq('assignee_id', userId).eq('status', 'done'),
        supabase.from('user_achievements')
          .select('achievement:achievements(id, title, icon, description, points)')
          .eq('user_id', userId),
      ])
      if (!active) return
      setUser(u)
      setTasksDone(count ?? 0)
      setAchs((earned ?? []).map((r: any) => r.achievement).filter(Boolean))
      setLoading(false)
    })()

    // Realtime subscription for presence updates
    const channel = supabase.channel(`user_profile_${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, (payload) => {
        if (active) {
          setUser(prev => prev ? { ...prev, last_seen: payload.new.last_seen, status: payload.new.status } : null)
        }
      })
      .subscribe()

    // Force re-render every minute for timeAgo
    const timer = setInterval(() => {
      setUser(prev => prev ? { ...prev } : null)
    }, 60000)

    return () => { 
      active = false 
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [userId, supabase])

  const lvl = user ? levelInfo(user.points) : null

  // Расчет реального статуса
  let currentStatus: 'online' | 'offline' = 'offline'
  let statusText = 'Не в сети'
  
  if (user) {
    const lastSeenMs = user.last_seen ? new Date(user.last_seen).getTime() : 0
    const isOnlineNow = user.last_seen && (Date.now() - lastSeenMs < 2 * 60 * 1000)
    currentStatus = isOnlineNow ? 'online' : 'offline'
    statusText = isOnlineNow ? 'Онлайн' : (user.last_seen ? `Был(а) ${timeAgo(user.last_seen)}` : 'Не в сети')
  }

  return (
    <Modal title={loading ? 'Профиль' : (user?.full_name ?? 'Профиль')} onClose={onClose} maxWidth="max-w-[420px]">
      {loading || !user ? (
        <div className="py-16 flex justify-center -mt-2">
          <Loader2 size={24} className="animate-spin text-mute" />
        </div>
      ) : (
        <div className="-mt-2">
          {/* Avatar + name */}
          <div className="text-center pb-5 border-b border-line mb-5">
            <div className="flex justify-center mb-3">
              <Avatar initials={getInitials(user.full_name)} color={colorFor(user.full_name)} size={72} status={currentStatus} />
            </div>
            <h2 className="text-[19px] font-bold tracking-tight">{user.full_name}</h2>
            <p className="text-mute text-[13px] mt-1">
              {user.position ?? ROLE_LABEL[user.role] ?? user.role} · BAZZAR Group
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[12px] text-mute2">
              <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[currentStatus] }} />
              {statusText}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center rounded-xl bg-[#F4F5FA]/50 border border-line py-3">
              <div className="text-[20px] font-bold text-gold">{user.points}</div>
              <div className="text-[10.5px] text-mute2 mt-0.5">баллов</div>
            </div>
            <div className="text-center rounded-xl bg-[#F4F5FA]/50 border border-line py-3">
              <div className="text-[20px] font-bold text-ok">{tasksDone}</div>
              <div className="text-[10.5px] text-mute2 mt-0.5">задач</div>
            </div>
            <div className="text-center rounded-xl bg-[#F4F5FA]/50 border border-line py-3">
              <div className="text-[14px] font-bold text-accent leading-tight px-1">{lvl?.current.name}</div>
              <div className="text-[10.5px] text-mute2 mt-0.5">уровень</div>
            </div>
          </div>

          {/* Level bar */}
          {lvl && (
            <div className="mb-5">
              <Progress value={lvl.progress} color="#FFC833" height={5} />
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-mute2 font-mono">
                <span>{lvl.current.name}</span>
                {lvl.next ? <span>{lvl.remaining} до «{lvl.next.name}»</span> : <span>макс. уровень</span>}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achs.length > 0 && (
            <div className="mb-5">
              <div className="text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Ачивки</div>
              <div className="flex flex-wrap gap-2">
                {achs.map(a => (
                  <div key={a.id} title={`${a.title} — ${a.description}`}
                    className="w-9 h-9 rounded-xl bg-[#F4F5FA]/50 border border-line inline-flex items-center justify-center text-lg hover:border-line2 transition-all">
                    {a.icon ?? '🏅'}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[12.5px] text-mute mb-4 truncate">{user.email}</div>

          <Button className="w-full" onClick={() => { onClose(); router.push('/chats') }}>
            <MessageSquare size={15} /> Написать в чате
          </Button>
        </div>
      )}
    </Modal>
  )
}
