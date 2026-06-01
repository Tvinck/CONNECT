'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Search, Download } from 'lucide-react'
import { Tag } from '@/components/ui/Tag'
import { OrderModal } from './OrderModal'
import type { PMOrder, PMProduct, PaymentStatus, GenStatus } from './types'
import { PAY_LABEL, PAY_COLOR, GEN_LABEL, GEN_COLOR, isStuck } from './types'
import { timeAgo } from '@/lib/utils'

const PAY_FILTERS: Array<PaymentStatus | 'all'> = ['all', 'paid', 'pending', 'refunded', 'failed']
const PAY_FILTER_LABEL: Record<string, string> = { all: 'Все', paid: 'Оплачен', pending: 'Ожидание', refunded: 'Возврат', failed: 'Ошибка оплаты' }

interface Props {
  orders: PMOrder[]
  products: PMProduct[]
}

export function OrdersTab({ orders: initialOrders, products }: Props) {
  const [orders,     setOrders]     = useState<PMOrder[]>(initialOrders)
  const [payFilter,  setPayFilter]  = useState<PaymentStatus | 'all'>('all')
  const [genFilter,  setGenFilter]  = useState<GenStatus | 'all'>('all')
  const [prodFilter, setProdFilter] = useState<string>('all')
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState<PMOrder | null>(null)
  const [stuckOnly,  setStuckOnly]  = useState(false)

  const stuckCount = useMemo(() => orders.filter(isStuck).length, [orders])

  const payCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    for (const o of orders) {
      counts[o.payment_status] = (counts[o.payment_status] ?? 0) + 1
    }
    return counts
  }, [orders])

  const filtered = useMemo(() => {
    let list = orders
    if (stuckOnly)                 list = list.filter(isStuck)
    if (payFilter !== 'all')       list = list.filter(o => o.payment_status === payFilter)
    if (genFilter !== 'all')       list = list.filter(o => o.gen_status === genFilter)
    if (prodFilter !== 'all')      list = list.filter(o => o.product_id === prodFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.client_email.toLowerCase().includes(q) ||
        o.client_name?.toLowerCase().includes(q) ||
        o.recipient?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, payFilter, genFilter, prodFilter, search, stuckOnly])

  const handleUpdated = (updated: PMOrder) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    setSelected(updated)
  }

  const exportCsv = () => {
    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = 'id,email,name,recipient,occasion,product,amount,payment,gen_status,created_at'
    const rows = filtered.map(o => [
      o.id, o.client_email, o.client_name, o.recipient, o.occasion,
      o.product?.name, o.amount, o.payment_status, o.gen_status, o.created_at,
    ].map(escape).join(','))
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `pm_orders_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Stuck warning banner */}
      {stuckCount > 0 && (
        <button
          onClick={() => setStuckOnly(s => !s)}
          className={`w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left
            ${stuckOnly
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15'}`}
        >
          <AlertTriangle size={16} className="shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-[13.5px]">{stuckCount} зависших заказа</span>
            <span className="text-[12px] ml-2 opacity-80">оплата прошла, генерация не завершена</span>
          </div>
          <span className="text-[11px] font-medium">{stuckOnly ? 'Показать все' : 'Показать зависшие'}</span>
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute2 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Email, имя, ID заказа..."
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2"
          />
        </div>

        {/* Product filter */}
        <select
          value={prodFilter}
          onChange={e => setProdFilter(e.target.value)}
          className="h-9 px-3 rounded-xl bg-white/[0.03] border border-line outline-none text-[12.5px] text-mute"
        >
          <option value="all">Все продукты</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
        </select>

        {/* Gen status filter */}
        <select
          value={genFilter}
          onChange={e => setGenFilter(e.target.value as GenStatus | 'all')}
          className="h-9 px-3 rounded-xl bg-white/[0.03] border border-line outline-none text-[12.5px] text-mute"
        >
          <option value="all">Весь статус генерации</option>
          {(['pending','processing','done','failed','manual'] as GenStatus[]).map(s =>
            <option key={s} value={s}>{GEN_LABEL[s]}</option>
          )}
        </select>

        <button
          onClick={exportCsv}
          title={`Экспорт ${filtered.length} заказов в CSV`}
          className="h-9 px-3 rounded-xl border border-line text-mute hover:text-white hover:border-line2 inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
        >
          <Download size={13} /> CSV ({filtered.length})
        </button>
      </div>

      {/* Payment status chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {PAY_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setPayFilter(f)}
            className={`h-7 px-3 rounded-lg text-[12px] font-medium border transition-colors
              ${payFilter === f
                ? 'bg-accent/20 border-accent/40 text-accent'
                : 'border-line bg-white/[0.02] text-mute hover:text-white'}`}
          >
            {PAY_FILTER_LABEL[f]}
            <span className="ml-1.5 opacity-60">
              {payCounts[f] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Orders table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-mute text-[13px]">Заказов не найдено</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(order => {
            const stuck = isStuck(order)
            return (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:bg-white/[0.03]
                  ${stuck ? 'border-amber-500/30 bg-amber-500/5' : 'border-line bg-white/[0.015]'}`}
              >
                {/* Stuck indicator */}
                {stuck && <AlertTriangle size={14} className="text-amber-400 shrink-0" />}

                {/* Product emoji + name */}
                <div className="shrink-0 text-[18px]">{order.product?.emoji ?? '🎁'}</div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13.5px] font-medium truncate">
                      {order.client_email}
                    </span>
                    {order.client_name && (
                      <span className="text-[11.5px] text-mute shrink-0">· {order.client_name}</span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-mute2 truncate">
                    {order.recipient && <span>Для: {order.recipient}</span>}
                    {order.occasion && <span className="ml-2">· {order.occasion}</span>}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-[14px] font-bold tabular-nums text-ok shrink-0">
                  +{order.amount.toLocaleString('ru-RU')} ₽
                </div>

                {/* Payment status dot */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: PAY_COLOR[order.payment_status] }} />
                  <span className="text-[11px] text-mute hidden sm:inline">{PAY_LABEL[order.payment_status]}</span>
                </div>

                {/* Gen status */}
                <div className="shrink-0">
                  <span
                    className="text-[11px] font-semibold px-2 h-5 rounded-full inline-flex items-center"
                    style={{ background: `${GEN_COLOR[order.gen_status]}20`, color: GEN_COLOR[order.gen_status] }}
                  >
                    {GEN_LABEL[order.gen_status]}
                  </span>
                </div>

                {/* Date */}
                <div className="text-[11px] text-mute2 shrink-0 hidden md:block">
                  {timeAgo(order.created_at)}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Order modal */}
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
