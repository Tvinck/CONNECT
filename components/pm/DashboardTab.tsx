'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, ShoppingCart, Users, DollarSign } from 'lucide-react'
import { fmtRub } from '@/lib/utils'
import type { PMOrder, PMProduct } from './types'

interface Props {
  orders: PMOrder[]
  products: PMProduct[]
}

function daysBefore(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

export function DashboardTab({ orders, products }: Props) {
  const paidOrders = useMemo(() => orders.filter(o => o.payment_status === 'paid'), [orders])

  const revenue = useMemo(() => {
    const cutToday = daysBefore(0)
    const cutWeek  = daysBefore(7)
    const cutMonth = daysBefore(30)
    let day = 0, week = 0, month = 0
    for (const o of paidOrders) {
      const d = new Date(o.created_at)
      const amt = Number(o.amount)
      if (d >= cutToday) day   += amt
      if (d >= cutWeek)  week  += amt
      if (d >= cutMonth) month += amt
    }
    return { day, week, month }
  }, [paidOrders])

  const byProduct = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number }> = {}
    for (const o of paidOrders) {
      const pid = o.product_id ?? 'unknown'
      if (!counts[pid]) counts[pid] = { count: 0, revenue: 0 }
      counts[pid].count++
      counts[pid].revenue += Number(o.amount)
    }
    return counts
  }, [paidOrders])

  const avgCheck = paidOrders.length > 0
    ? paidOrders.reduce((s, o) => s + Number(o.amount), 0) / paidOrders.length
    : 0

  // Last 7 days bar chart data
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const start = daysBefore(6 - i)
      const end   = daysBefore(5 - i)
      const total = paidOrders.filter(o => {
        const d = new Date(o.created_at)
        return d >= start && d < end
      }).reduce((s, o) => s + Number(o.amount), 0)
      return {
        label: start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        total,
      }
    })
  }, [paidOrders])

  const maxBar = Math.max(...last7.map(d => d.total), 1)

  const statCard = (label: string, value: string, sub?: string, icon?: React.ReactNode) => (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[11px] text-mute2 uppercase tracking-[0.1em] font-semibold">{label}</div>
        {icon && <div className="text-mute2">{icon}</div>}
      </div>
      <div className="text-[22px] font-bold tabular-nums tracking-tight">{value}</div>
      {sub && <div className="text-[11.5px] text-mute mt-1">{sub}</div>}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Revenue cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCard('Сегодня', fmtRub(revenue.day), undefined, <TrendingUp size={16} />)}
        {statCard('За 7 дней', fmtRub(revenue.week), undefined, <TrendingUp size={16} />)}
        {statCard('За 30 дней', fmtRub(revenue.month), undefined, <TrendingUp size={16} />)}
        {statCard('Средний чек', fmtRub(avgCheck), `${paidOrders.length} оплаченных`, <DollarSign size={16} />)}
      </div>

      {/* Bar chart — last 7 days */}
      <div className="card p-5">
        <h3 className="text-[15px] font-semibold mb-4">Выручка за 7 дней</h3>
        <div className="flex items-end gap-2 h-28">
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="text-[10px] text-mute tabular-nums">
                {d.total > 0 ? fmtRub(d.total) : ''}
              </div>
              <div className="w-full rounded-t-md bg-accent/20 relative" style={{ height: `${Math.max(4, (d.total / maxBar) * 80)}px` }}>
                <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-accent transition-all" style={{ height: '100%' }} />
              </div>
              <div className="text-[9px] text-mute2 text-center">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders by product */}
      <div className="card p-5">
        <h3 className="text-[15px] font-semibold mb-4">Заказы по продуктам</h3>
        <div className="space-y-3">
          {products.map(p => {
            const data = byProduct[p.id] ?? { count: 0, revenue: 0 }
            const pct  = paidOrders.length > 0 ? (data.count / paidOrders.length) * 100 : 0
            const profit = data.revenue - data.count * p.cost
            return (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{p.emoji}</span>
                    <span className="text-[13.5px] font-medium">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-ok tabular-nums">+{fmtRub(profit)}</div>
                    <div className="text-[11px] text-mute">{data.count} зак. · {fmtRub(data.revenue)}</div>
                  </div>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* API cost estimate */}
      <div className="card p-5">
        <h3 className="text-[15px] font-semibold mb-4">Оценка расходов на API (30 дней)</h3>
        <div className="grid grid-cols-3 gap-3">
          {products.map(p => {
            const data = byProduct[p.id] ?? { count: 0, revenue: 0 }
            const cost = data.count * p.cost
            return (
              <div key={p.id} className="rounded-xl bg-white/[0.025] border border-line p-3.5">
                <div className="text-[16px] mb-1">{p.emoji}</div>
                <div className="text-[11px] text-mute2 mb-0.5">{p.name}</div>
                <div className="text-[16px] font-bold text-err tabular-nums">−{fmtRub(cost)}</div>
                <div className="text-[10.5px] text-mute mt-0.5">{data.count} шт · {p.cost} ₽/шт</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
