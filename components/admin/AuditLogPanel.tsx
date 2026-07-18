'use client'

import { useState, useMemo } from 'react'
import { Search, Clock } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

type LogRow = {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  meta: Record<string, unknown> | null
  created_at: string
  user: { full_name: string } | null
}

const ACTION_COLOR: Record<string, string> = {
  'task.create':        '#1472F5',
  'task.update':        '#00C2FF',
  'task.delete':        '#EF4444',
  'client.create':      '#22C55E',
  'client.update':      '#00C2FF',
  'client.delete':      '#EF4444',
  'user.invite':        '#FFC833',
  'user.role_change':   '#F59E0B',
  'order.refund':       '#EF4444',
  'order.manual_done':  '#22C55E',
  'order.restart':      '#F59E0B',
  'promo.create':       '#6F4FE8',
  'promo.delete':       '#EF4444',
  'transaction.create': '#22C55E',
  'transaction.delete': '#EF4444',
  'shop.purchase':      '#FFC833',
  'profile.update':     '#8B92B4',
}

const ACTION_LABEL: Record<string, string> = {
  'task.create':        'Задача создана',
  'task.update':        'Задача обновлена',
  'task.delete':        'Задача удалена',
  'client.create':      'Клиент добавлен',
  'client.update':      'Клиент обновлён',
  'client.delete':      'Клиент удалён',
  'user.invite':        'Сотрудник приглашён',
  'user.role_change':   'Роль изменена',
  'order.refund':       'Возврат оформлен',
  'order.manual_done':  'Заказ закрыт вручную',
  'order.restart':      'Генерация перезапущена',
  'promo.create':       'Промокод создан',
  'promo.delete':       'Промокод удалён',
  'transaction.create': 'Транзакция добавлена',
  'transaction.delete': 'Транзакция удалена',
  'shop.purchase':      'Покупка в магазине',
  'profile.update':     'Профиль обновлён',
}

interface Props {
  logs: LogRow[]
}

export function AuditLogPanel({ logs }: Props) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const categories = useMemo(() => {
    const cats = new Set(logs.map(l => l.action.split('.')[0]))
    return ['all', ...Array.from(cats).sort()]
  }, [logs])

  const filtered = useMemo(() => {
    let list = logs
    if (actionFilter !== 'all') list = list.filter(l => l.action.startsWith(actionFilter + '.'))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        l.action.toLowerCase().includes(q) ||
        l.user?.full_name.toLowerCase().includes(q) ||
        l.entity_id?.toLowerCase().includes(q)
      )
    }
    return list
  }, [logs, actionFilter, search])

  if (logs.length === 0) return (
    <div className="card p-6 text-center text-mute text-[13px]">
      Журнал аудита пуст — действия появятся здесь по мере работы системы
    </div>
  )

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Журнал аудита</h3>
          <p className="text-[12px] text-mute mt-0.5">Последние {logs.length} действий</p>
        </div>
        <Clock size={16} className="text-mute2" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute2 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по действию, пользователю..."
            className="w-full h-8 pl-8 pr-3 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[12.5px] placeholder:text-mute2"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="h-8 px-3 rounded-xl bg-bg border border-line outline-none text-[12px] text-mute"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'Все категории' : c}</option>
          ))}
        </select>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-mute text-[12.5px]">Ничего не найдено</div>
      ) : (
        <div className="space-y-px">
          {filtered.map(log => {
            const color = ACTION_COLOR[log.action] ?? '#8B92B4'
            const label = ACTION_LABEL[log.action] ?? log.action
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-black/[0.02] transition-colors"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[11px] font-bold px-1.5 h-4.5 rounded inline-flex items-center"
                      style={{ background: `${color}18`, color }}
                    >
                      {label}
                    </span>
                    {log.entity_id && (
                      <code className="text-[10px] text-mute2 font-mono">
                        {log.entity_id.length > 20 ? log.entity_id.slice(0, 8) + '…' : log.entity_id}
                      </code>
                    )}
                  </div>
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="text-[11px] text-mute mt-0.5 font-mono truncate">
                      {Object.entries(log.meta).map(([k, v]) =>
                        `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}`
                      ).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11.5px] text-slate-600 font-medium">
                    {log.user?.full_name.split(' ')[0] ?? '—'}
                  </div>
                  <div className="text-[10.5px] text-mute2 font-mono">{timeAgo(log.created_at)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
