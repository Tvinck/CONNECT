import { getInitials, colorFor } from '@/lib/utils'
import { dateTime } from './kit'

interface Log {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  meta: any
  created_at: string
}

// Человекочитаемые ярлыки для частых действий (иначе показываем сырой action).
const ACTION_LABEL: Record<string, string> = {
  'apple_certs.approve': 'согласовал(а) сертификат',
  'apple_certs.reject': 'отклонил(а) сертификат',
  'apple_certs.register': 'зарегистрировал(а) сертификат',
  'user.role_change': 'изменил(а) права роли',
  'task.create': 'создал(а) задачу',
  'task.update': 'обновил(а) задачу',
  'product.update': 'изменил(а) товар',
  'transaction.create': 'провёл(а) транзакцию',
}

function humanize(action: string): string {
  return ACTION_LABEL[action] || action.replace(/[._]/g, ' ')
}

export function ActivitySection({ logs, users }: { logs: Log[]; users: { id: string; full_name: string }[] }) {
  const nameById = new Map(users.map((u) => [u.id, u.full_name]))

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-5">
      <h1 className="text-[22px] font-bold tracking-tight">Активность · кто, что и когда</h1>

      <div className="card">
        <div className="divide-y divide-black/[0.05]">
          {logs.length === 0 && <div className="p-10 text-center text-mute">Событий пока нет.</div>}
          {logs.map((l) => {
            const name = (l.user_id && nameById.get(l.user_id)) || 'Система'
            const metaStr = l.meta && typeof l.meta === 'object' ? Object.entries(l.meta).map(([k, v]) => `${k}: ${v}`).join(' · ') : ''
            return (
              <div key={l.id} className="p-3.5 flex items-center gap-3 text-[13px]">
                <span className="shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center text-[12px] font-bold text-white" style={{ background: colorFor(name) }}>
                  {getInitials(name)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="leading-snug">
                    <span className="font-semibold">{name}</span> <span className="text-mute">{humanize(l.action)}</span>
                    {l.entity_type ? <span className="text-mute"> · {l.entity_type}</span> : null}
                  </div>
                  {metaStr ? <div className="text-[11px] text-mute truncate">{metaStr}</div> : null}
                </div>
                <span className="shrink-0 text-[11px] text-mute">{dateTime(l.created_at)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
