'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useUIStore }   from '@/store/ui'
import type { PMApiLog, PMOrder } from './types'
import { timeAgo } from '@/lib/utils'

interface Props {
  logs: PMApiLog[]
  orders: PMOrder[]
}

const SERVICES = [
  { id: 'suno',    name: 'Suno API',  desc: 'Генерация ИИ-музыки',   product: '🎵' },
  { id: 'heygen',  name: 'HeyGen',    desc: 'Видео от знаменитости', product: '🎭' },
  { id: 'ffmpeg',  name: 'FFmpeg',    desc: 'Сборка видео из фото',  product: '🎬' },
  { id: 'yukassa', name: 'ЮКасса',   desc: 'Приём платежей',        product: '💳' },
  { id: 'resend',  name: 'Resend',    desc: 'Email-рассылка',        product: '📧' },
]

const LOG_COLOR = { info: '#22C55E', warn: '#F59E0B', error: '#EF4444' }
const LOG_LABEL = { info: 'INFO', warn: 'WARN', error: 'ERR' }
const LOG_ICON  = {
  info:  <CheckCircle size={14} className="text-ok" />,
  warn:  <AlertCircle size={14} className="text-warn" />,
  error: <XCircle     size={14} className="text-err" />,
}

export function MonitoringTab({ logs: initialLogs, orders }: Props) {
  const supabase = createClient()
  const addToast = useUIStore(s => s.addToast)
  const [logs,   setLogs]   = useState<PMApiLog[]>(initialLogs)
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all')

  const stuckOrders  = orders.filter(o =>
    o.payment_status === 'paid' && !['done', 'manual'].includes(o.gen_status)
  )
  const failedOrders = orders.filter(o => o.gen_status === 'failed')

  const serviceStatus = (serviceId: string) => {
    const svcLogs = logs.filter(l => l.service === serviceId)
    const last = svcLogs[0]
    if (!last) return 'ok'
    const ageMs = Date.now() - new Date(last.created_at).getTime()
    if (last.level === 'error' && ageMs < 60 * 60 * 1000) return 'error'
    if (last.level === 'warn'  && ageMs < 60 * 60 * 1000) return 'warn'
    return 'ok'
  }

  // Single-pass counts for filter badges
  const logCounts = useMemo(() => {
    const r = { info: 0, warn: 0, error: 0 }
    for (const l of logs) r[l.level as keyof typeof r]++
    return r
  }, [logs])

  const deleteLog = async (id: string) => {
    const snapshot = logs
    setLogs(prev => prev.filter(l => l.id !== id))
    const { error } = await supabase.from('pm_api_logs').delete().eq('id', id)
    if (error) { addToast('Ошибка', error.message, 'err'); setLogs(snapshot) }
  }

  const clearErrors = async () => {
    const errIds = logs.filter(l => l.level === 'error').map(l => l.id)
    if (errIds.length === 0) return
    const snapshot = logs
    setLogs(prev => prev.filter(l => l.level !== 'error'))
    const { error } = await supabase.from('pm_api_logs').delete().in('id', errIds)
    if (error) { addToast('Ошибка', error.message, 'err'); setLogs(snapshot) }
    else addToast('Готово', `${errIds.length} ошибок очищено`, 'accent')
  }

  const visibleLogs = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  return (
    <div className="space-y-5">
      {/* Alert summary */}
      {(stuckOrders.length > 0 || failedOrders.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {stuckOrders.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-[13.5px] font-semibold text-amber-300">{stuckOrders.length} зависших</div>
                <div className="text-[11px] text-amber-400/70">оплачены, не сгенерированы</div>
              </div>
            </div>
          )}
          {failedOrders.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-err/10 border border-err/20 rounded-xl">
              <XCircle size={16} className="text-err shrink-0" />
              <div>
                <div className="text-[13.5px] font-semibold text-err">{failedOrders.length} ошибок генерации</div>
                <div className="text-[11px] text-err/70">требуют вмешательства</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service status grid */}
      <div className="card p-5">
        <h3 className="text-[15px] font-semibold mb-4">Статус сервисов</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SERVICES.map(svc => {
            const status = serviceStatus(svc.id)
            const color  = status === 'ok' ? '#22C55E' : status === 'warn' ? '#F59E0B' : '#EF4444'
            const label  = status === 'ok' ? 'OK'      : status === 'warn' ? 'Предупр.' : 'Ошибка'
            return (
              <div key={svc.id} className="rounded-xl bg-white/[0.025] border border-line p-3.5">
                <div className="text-[20px] mb-2">{svc.product}</div>
                <div className="text-[13px] font-semibold">{svc.name}</div>
                <div className="text-[11px] text-mute mb-2">{svc.desc}</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-mute2 mt-3">
          * Статус по ошибкам в логе за последний час. Для реального мониторинга подключите health-check эндпоинт.
        </p>
      </div>

      {/* Error log */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold">Лог событий</h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['all', 'error', 'warn', 'info'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors
                    ${filter === f ? 'bg-accent/20 border-accent/40 text-accent' : 'border-line text-mute hover:text-white'}`}
                >
                  {f === 'all' ? 'Все' : f.toUpperCase()}
                  <span className="ml-1 opacity-60">
                    {f === 'all' ? logs.length : logCounts[f as keyof typeof logCounts]}
                  </span>
                </button>
              ))}
            </div>
            {logCounts.error > 0 && (
              <Button size="sm" variant="ghost" onClick={clearErrors} className="text-err border-err/20 hover:bg-err/10">
                <Trash2 size={12} /> Очистить ошибки
              </Button>
            )}
          </div>
        </div>

        {visibleLogs.length === 0 ? (
          <div className="text-center py-8 text-mute text-[12.5px]">Логов нет 🎉</div>
        ) : (
          <div className="space-y-1.5 font-mono">
            {visibleLogs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-line hover:bg-white/[0.03] group"
              >
                <div className="shrink-0 mt-0.5">{LOG_ICON[log.level]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-bold px-1.5 h-4 rounded inline-flex items-center"
                      style={{ background: `${LOG_COLOR[log.level]}20`, color: LOG_COLOR[log.level] }}
                    >
                      {LOG_LABEL[log.level]}
                    </span>
                    <span className="text-[11px] font-bold text-white/80">{log.service}</span>
                    <span className="text-[10.5px] text-mute2">{timeAgo(log.created_at)}</span>
                  </div>
                  <div className="text-[12px] text-mute break-all">{log.message}</div>
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  aria-label="Удалить запись"
                  className="opacity-0 group-hover:opacity-100 text-mute hover:text-err transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
