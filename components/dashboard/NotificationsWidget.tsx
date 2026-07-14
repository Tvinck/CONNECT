'use client'

import { useState } from 'react'
import { CheckSquare, Flame, BellOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'

type NotifRow = {
  id: string
  type: string
  title: string
  body?: string | null
  is_read: boolean
  created_at: string
}

const NOTIF_TONE: Record<string, { bg: string; text: string }> = {
  task:  { bg: 'bg-accent/15', text: 'text-accent' },
  ach:   { bg: 'bg-gold/15',   text: 'text-gold'   },
  alert: { bg: 'bg-err/15',    text: 'text-err'    },
  info:  { bg: 'bg-accent/15', text: 'text-accent' },
}

interface Props {
  initialNotifications: NotifRow[]
  userId: string
}

export function NotificationsWidget({ initialNotifications, userId }: Props) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<NotifRow[]>(initialNotifications)

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  }

  return (
    <div className="card p-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-[17px] font-semibold tracking-tight">Уведомления</h3>
          <p className="text-[12.5px] text-mute mt-0.5">
            {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Всё прочитано'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-[12.5px] text-mute hover:text-slate-800 transition-colors"
          >
            Отметить всё
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-mute text-[12.5px]">
            <BellOff size={18} className="opacity-40" />
            Уведомлений нет
          </div>
        )}
        {notifications.map(n => {
          const tone = NOTIF_TONE[n.type] ?? NOTIF_TONE.info
          return (
            <div
              key={n.id}
              onClick={() => { if (!n.is_read) markAsRead(n.id) }}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                ${n.is_read
                  ? 'border-line opacity-45 cursor-default'
                  : 'border-line hover:border-line2 hover:bg-black/[0.02] cursor-pointer'}`}
            >
              <div className={`w-9 h-9 rounded-lg ${tone.bg} ${tone.text} inline-flex items-center justify-center shrink-0`}>
                {n.type === 'task'  && <CheckSquare size={16} />}
                {n.type === 'ach'   && <span className="text-base">🏆</span>}
                {n.type === 'alert' && <Flame size={16} />}
                {!['task', 'ach', 'alert'].includes(n.type) && <CheckSquare size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold tracking-tight">{n.title}</span>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                </div>
                {n.body && <div className="text-[11.5px] text-mute mt-0.5 line-clamp-2">{n.body}</div>}
              </div>
              <span className="text-[10.5px] text-mute2 font-mono shrink-0">{timeAgo(n.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
