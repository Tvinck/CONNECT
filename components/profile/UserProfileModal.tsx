'use client'

import { useEffect, useState } from 'react'
import { X, MessageSquare, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { colorFor, getInitials, levelInfo } from '@/lib/utils'
import type { User } from '@/types'
import { useRouter } from 'next/navigation'

interface AchRow { id: string; title: string; icon: string; description: string }

const STATUS_LABEL: Record<string, string> = {
  online: 'Онлайн', busy: 'Занят', offline: 'Не в сети',
}
const ROLE_LABEL: Record<string, string> = {
  ceo: 'CEO', design: 'Дизайнер', dev: 'Разработка', sales: 'Продажи', support: 'Поддержка',
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
          .select('achievement:achievements(id, title, icon, description)')
          .eq('user_id', userId),
      ])
      if (!active) return
      setUser(u)
      setTasksDone(count ?? 0)
      setAchs((earned ?? []).map((r: any) => r.achievement).filter(Boolean))
      setLoading(false)
    })()
    return () => { active = false }
  }, [userId])

  const lvl = user ? levelInfo(user.points) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#151829] border border-line rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden">
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center z-10">
          <X size={16} />
        </button>

        {loading || !user ? (
          <div className="py-20 flex justify-center"><Loader2 size={24} className="animate-spin text-mute" /></div>
        ) : (
          <>
            <div className="px-6 pt-8 pb-5 text-center border-b border-line">
              <div className="flex justify-center mb-3">
                <Avatar initials={getInitials(user.full_name)} color={colorFor(user.full_name)} size={72} status={user.status} />
              </div>
              <h2 className="text-[19px] font-bold tracking-tight">{user.full_name}</h2>
              <p className="text-mute text-[13px] mt-1">
                {user.position ?? ROLE_LABEL[user.role] ?? user.role} · BAZZAR Group
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-[12px] text-mute2">
                <span className="w-2 h-2 rounded-full"
                  style={{ background: user.status === 'online' ? '#22C55E' : user.status === 'busy' ? '#F59E0B' : '#5A6188' }} />
                {STATUS_LABEL[user.status]}
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center">
                  <div className="text-[20px] font-bold text-gold">{user.points}</div>
                  <div className="text-[10.5px] text-mute2 mt-0.5">баллов</div>
                </div>
                <div className="text-center">
                  <div className="text-[20px] font-bold text-ok">{tasksDone}</div>
                  <div className="text-[10.5px] text-mute2 mt-0.5">задач</div>
                </div>
                <div className="text-center">
                  <div className="text-[20px] font-bold text-accent">{lvl?.current.name.slice(0, 8)}</div>
                  <div className="text-[10.5px] text-mute2 mt-0.5">уровень</div>
                </div>
              </div>

              {lvl && (
                <div className="mb-5">
                  <Progress value={lvl.progress} color="#FFC833" height={5} />
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-mute2 font-mono">
                    <span>{lvl.current.name}</span>
                    {lvl.next ? <span>{lvl.remaining} до «{lvl.next.name}»</span> : <span>макс.</span>}
                  </div>
                </div>
              )}

              {achs.length > 0 && (
                <div className="mb-5">
                  <div className="text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Ачивки</div>
                  <div className="flex flex-wrap gap-2">
                    {achs.map(a => (
                      <div key={a.id} title={`${a.title} — ${a.description}`}
                        className="w-9 h-9 rounded-xl bg-white/[0.04] border border-line inline-flex items-center justify-center text-lg">
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
          </>
        )}
      </div>
    </div>
  )
}
