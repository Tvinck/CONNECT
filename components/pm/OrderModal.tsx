'use client'

import { useState } from 'react'
import {
  RefreshCw, Download, Send, Upload, CheckCircle, RotateCcw, Loader2, ExternalLink,
} from 'lucide-react'
import { Modal }  from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Tag }    from '@/components/ui/Tag'
import { createClient } from '@/lib/supabase/client'
import { useUIStore }   from '@/store/ui'
import { auditLog }     from '@/lib/audit'
import type { PMOrder } from './types'
import { PAY_LABEL, PAY_COLOR, GEN_LABEL, GEN_COLOR, isStuck } from './types'
import { timeAgo } from '@/lib/utils'

interface Props {
  order: PMOrder
  onClose: () => void
  onUpdated: (o: PMOrder) => void
}

export function OrderModal({ order, onClose, onUpdated }: Props) {
  const supabase = createClient()
  const addToast = useUIStore(s => s.addToast)

  const [busy,          setBusy]          = useState(false)
  const [notes,         setNotes]         = useState(order.admin_notes ?? '')
  const [fileUrl,       setFileUrl]       = useState('')
  const [showUpload,    setShowUpload]    = useState(false)
  const [confirmRefund, setConfirmRefund] = useState(false)

  const patch = async (fields: Partial<PMOrder>, auditAction?: Parameters<typeof auditLog>[0]) => {
    setBusy(true)
    const { data, error } = await supabase
      .from('pm_orders')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('*, product:pm_products(*)')
      .single()
    setBusy(false)
    if (error) { addToast('Ошибка', error.message, 'err'); return }
    onUpdated(data as unknown as PMOrder)
    // Log only after confirmed DB success
    if (auditAction) auditLog(auditAction)
  }

  const restartGen  = () => patch(
    { gen_status: 'pending', gen_started_at: null, gen_done_at: null },
    { action: 'order.restart', entityType: 'order', entityId: order.id },
  )

  const markDone    = () => patch(
    { gen_status: 'manual', gen_done_at: new Date().toISOString(), sent_at: new Date().toISOString() },
    { action: 'order.manual_done', entityType: 'order', entityId: order.id },
  )

  const markRefunded = () => patch(
    { payment_status: 'refunded', admin_notes: (notes ? notes + '\n' : '') + `Возврат оформлен ${new Date().toLocaleDateString('ru-RU')}` },
    { action: 'order.refund', entityType: 'order', entityId: order.id, meta: { amount: order.amount } },
  )

  const saveNotes = () => patch({ admin_notes: notes })

  const uploadFile = async () => {
    if (!fileUrl.trim()) return
    await patch({ file_url: fileUrl.trim(), gen_status: 'manual', gen_done_at: new Date().toISOString() })
    setFileUrl('')
    setShowUpload(false)
  }

  const resend = async () => {
    await patch({ sent_at: new Date().toISOString() })
    addToast('Готово', 'Файл помечен как отправленный', 'accent')
  }

  const stuck = isStuck(order)

  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-line last:border-0">
      <span className="text-[11.5px] text-mute2 font-semibold uppercase tracking-[0.08em] w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-[13px] text-slate-700 flex-1">{value}</span>
    </div>
  )

  return (
    <Modal
      title={`Заказ · ${order.product?.emoji ?? '🎁'} ${order.product?.name ?? order.product_id}`}
      onClose={onClose}
      maxWidth="max-w-[680px]"
    >
      <div className="space-y-5">
        {/* Stuck banner */}
        {stuck && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-[12.5px]">
            <span>⚠️</span>
            <span className="font-semibold">Зависший заказ</span>
            <span className="text-amber-400/70">— оплата прошла, генерация не завершена</span>
          </div>
        )}

        {/* Status badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-mute2 uppercase tracking-wider">Оплата:</span>
            <span className="text-[12px] font-bold px-2.5 h-5 rounded-full inline-flex items-center"
              style={{ background: `${PAY_COLOR[order.payment_status]}25`, color: PAY_COLOR[order.payment_status] }}>
              {PAY_LABEL[order.payment_status]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-mute2 uppercase tracking-wider">Генерация:</span>
            <span className="text-[12px] font-bold px-2.5 h-5 rounded-full inline-flex items-center"
              style={{ background: `${GEN_COLOR[order.gen_status]}25`, color: GEN_COLOR[order.gen_status] }}>
              {GEN_LABEL[order.gen_status]}
            </span>
          </div>
          <span className="text-[11.5px] text-mute ml-auto">{timeAgo(order.created_at)}</span>
        </div>

        {/* Order info */}
        <div className="card p-4">
          {infoRow('ID', <code className="text-[11px] text-accent/80 font-mono">{order.id}</code>)}
          {infoRow('Email', order.client_email)}
          {order.client_name && infoRow('Имя', order.client_name)}
          {infoRow('Сумма', <span className="font-bold text-ok">{order.amount.toLocaleString('ru-RU')} ₽</span>)}
          {order.recipient && infoRow('Для кого', order.recipient)}
          {order.occasion  && infoRow('Повод', order.occasion)}
          {order.message   && infoRow('Текст', <span className="whitespace-pre-wrap">{order.message}</span>)}
          {order.payment_id && infoRow('ID платежа', <code className="text-[11px] font-mono">{order.payment_id}</code>)}
        </div>

        {/* Timeline */}
        <div className="relative flex items-center justify-between text-[11px] text-mute">
          {/* Background Track */}
          <div className="absolute top-[7px] left-[10%] right-[10%] h-[2px] bg-line -z-0" />

          {/* Foreground Active Track */}
          {(() => {
            const steps = [
              order.created_at,
              order.paid_at,
              order.gen_started_at,
              order.gen_done_at,
              order.sent_at,
            ]
            const activeIndex = steps.filter(Boolean).length - 1
            const widthPct = activeIndex > 0 ? (activeIndex / (steps.length - 1)) * 80 : 0
            return (
              <div
                className="absolute top-[7px] left-[10%] h-[2px] bg-ok transition-all duration-300 -z-0"
                style={{ width: `${widthPct}%` }}
              />
            )
          })()}

          {[
            { label: 'Создан',   time: order.created_at },
            { label: 'Оплачен',  time: order.paid_at },
            { label: 'Генерация', time: order.gen_started_at },
            { label: 'Готов',    time: order.gen_done_at },
            { label: 'Отправлен', time: order.sent_at },
          ].map((step, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 relative z-10">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 transition-all ${
                step.time
                  ? 'bg-ok border-ok text-white'
                  : 'bg-card border-line2 text-mute2'
              }`}>
                {step.time && <span className="w-1 h-1 bg-white rounded-full" />}
              </div>
              <span className="text-center leading-tight font-medium text-[11.5px] mt-1">{step.label}</span>
              {step.time && (
                <span className="text-mute2 text-[10px] mt-0.5 whitespace-nowrap">
                  {new Date(step.time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* File link */}
        {order.file_url && (
          <a
            href={order.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-bg border border-line rounded-xl text-[13px] text-accent hover:bg-black/[0.05] transition-colors"
          >
            <ExternalLink size={14} />
            <span className="flex-1 truncate">{order.file_url}</span>
            <Download size={14} />
          </a>
        )}

        {/* Upload file */}
        {showUpload && (
          <div className="flex gap-2">
            <input
              value={fileUrl}
              onChange={e => setFileUrl(e.target.value)}
              placeholder="https://... ссылка на готовый файл"
              className="flex-1 h-10 px-3 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2"
            />
            <Button size="sm" onClick={uploadFile} disabled={busy || !fileUrl.trim()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : 'Сохранить'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowUpload(false)}>Отмена</Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={restartGen}
            disabled={busy}
            className="flex items-center gap-2 justify-center"
          >
            <RefreshCw size={13} /> Перезапустить
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUpload(s => !s)}
            disabled={busy}
            className="flex items-center gap-2 justify-center"
          >
            <Upload size={13} /> Загрузить файл
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resend}
            disabled={busy || !order.file_url}
            className="flex items-center gap-2 justify-center"
          >
            <Send size={13} /> Переслать
          </Button>

          <Button
            size="sm"
            onClick={markDone}
            disabled={busy || order.gen_status === 'done' || order.gen_status === 'manual'}
            className="flex items-center gap-2 justify-center bg-ok/20 text-ok border-ok/30 hover:bg-ok/30"
          >
            <CheckCircle size={13} /> Выполнен
          </Button>

          {confirmRefund ? (
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <span className="text-[12px] text-err flex-1">Подтвердить возврат?</span>
              <button
                onClick={() => { markRefunded(); setConfirmRefund(false) }}
                className="text-[11.5px] text-err font-semibold px-2 h-7 rounded-lg bg-err/15 hover:bg-err/25 transition-colors"
              >
                Да
              </button>
              <button
                onClick={() => setConfirmRefund(false)}
                className="text-[11.5px] text-mute px-2 h-7 rounded-lg hover:text-slate-800 transition-colors"
              >
                Отмена
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setConfirmRefund(true)}
              disabled={busy || order.payment_status === 'refunded'}
              className="flex items-center gap-2 justify-center bg-err/10 text-err border-err/20 hover:bg-err/20"
            >
              <RotateCcw size={13} /> Возврат
            </Button>
          )}
        </div>

        {/* Admin notes */}
        <div>
          <label className="block text-[11.5px] text-mute2 uppercase tracking-[0.08em] font-semibold mb-2">
            Заметки администратора
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Внутренние заметки по этому заказу..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2 resize-none"
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" variant="ghost" onClick={saveNotes} disabled={busy || notes === (order.admin_notes ?? '')}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : 'Сохранить заметки'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
