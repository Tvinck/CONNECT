'use client'

import { useMemo, useState } from 'react'
import { Search, Download } from 'lucide-react'
import type { Cert, ManualReg } from '@/lib/bazzar2/load'
import { channelMeta, money, num, dateTime } from './kit'
import { exportCsv } from '@/lib/bazzar2/csv'

const DAY = 86_400_000
const PERIODS = [
  { key: 7, label: '7 дней' },
  { key: 30, label: '30 дней' },
  { key: 90, label: '90 дней' },
]

export function SalesSection({ certs, manual }: { certs: Cert[]; manual: ManualReg[] }) {
  const [period, setPeriod] = useState(30)
  const [channel, setChannel] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const since = Date.now() - period * DAY
    return certs.filter((c) => new Date(c.created_at).getTime() >= since)
  }, [certs, period])

  const channels = useMemo(() => {
    const map = new Map<string, { label: string; color: string; revenue: number; cost: number; count: number }>()
    for (const c of filtered) {
      const m = channelMeta(c.source)
      const cur = map.get(m.label) || { label: m.label, color: m.color, revenue: 0, cost: 0, count: 0 }
      cur.revenue += c.sale_price || 0
      cur.cost += c.api_cost || 0
      cur.count += 1
      map.set(m.label, cur)
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [filtered])

  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0)

  const rows = useMemo(() => {
    let r = channel ? filtered.filter((c) => channelMeta(c.source).label === channel) : filtered
    const s = search.trim().toLowerCase()
    if (s) r = r.filter((c) => (c.plan_id || '').toLowerCase().includes(s) || (c.udid || '').toLowerCase().includes(s))
    return r
  }, [filtered, channel, search])

  const exportRows = () =>
    exportCsv('bazzar-sales', rows, [
      { key: 'created_at', label: 'Дата', value: (c) => new Date(c.created_at).toLocaleString('ru-RU') },
      { key: 'source', label: 'Канал', value: (c) => channelMeta(c.source).label },
      { key: 'plan_id', label: 'Товар' },
      { key: 'udid', label: 'UDID' },
      { key: 'sale_price', label: 'Цена' },
      { key: 'api_cost', label: 'Себестоимость' },
      { key: 'margin', label: 'Маржа', value: (c) => (c.sale_price || 0) - (c.api_cost || 0) },
      { key: 'crm_status', label: 'Статус' },
    ])

  // Воронка ручных заявок (Авито)
  const funnel = useMemo(() => {
    const counts = { thinking: 0, awaiting_payment: 0, paid: 0, refused: 0 } as Record<string, number>
    for (const m of manual) counts[m.status] = (counts[m.status] || 0) + 1
    const total = manual.length || 1
    return {
      total: manual.length,
      thinking: counts.thinking,
      awaiting: counts.awaiting_payment,
      paid: counts.paid,
      refused: counts.refused,
      conv: Math.round((counts.paid / total) * 100),
    }
  }, [manual])

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-[22px] font-bold tracking-tight">Продажи · откуда → куда</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск: товар, UDID" className="w-[200px] h-9 pl-9 pr-3 bg-card border border-line rounded-xl text-[13px] outline-none focus:border-accent" />
          </div>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold ${period === p.key ? 'bg-brand text-[#171821]' : 'text-mute hover:bg-black/[0.04]'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Каналы */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {channels.length === 0 && <div className="text-mute text-[13px]">Нет продаж за период.</div>}
        {channels.map((ch) => {
          const on = channel === ch.label
          const pct = totalRevenue ? Math.round((ch.revenue / totalRevenue) * 100) : 0
          return (
            <button
              key={ch.label}
              onClick={() => setChannel(on ? null : ch.label)}
              className={`card p-4 text-left transition-all ${on ? 'ring-2' : 'hover:-translate-y-0.5'}`}
              style={on ? ({ ['--tw-ring-color' as any]: ch.color } as React.CSSProperties) : undefined}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: ch.color }} />
                <span className="text-[13px] font-semibold">{ch.label}</span>
              </div>
              <div className="text-[20px] font-bold tabular-nums">{money(ch.revenue)}</div>
              <div className="text-[12px] text-mute mt-1">
                {ch.count} прод. · {pct}% · маржа {money(ch.revenue - ch.cost)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Воронка ручных заявок */}
      <div className="card p-5">
        <div className="text-[14px] font-bold mb-4">Воронка ручной регистрации (Авито/Telegram)</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <FunnelStep label="Всего заявок" value={funnel.total} color="#8B92B4" />
          <FunnelStep label="Думает" value={funnel.thinking} color="#F59E0B" />
          <FunnelStep label="Ждёт оплату" value={funnel.awaiting} color="#1472F5" />
          <FunnelStep label="Оплачено" value={funnel.paid} color="#22C55E" />
          <FunnelStep label="Конверсия" value={`${funnel.conv}%`} color="#BFF128" />
        </div>
      </div>

      {/* Лента продаж */}
      <div className="card">
        <div className="p-4 flex items-center justify-between border-b border-black/[0.05]">
          <div className="text-[14px] font-bold">
            Продажи {channel ? `· ${channel}` : ''} <span className="text-mute font-normal">({num(rows.length)})</span>
          </div>
          <div className="flex items-center gap-3">
            {channel && (
              <button onClick={() => setChannel(null)} className="text-[12px] text-accent">Сбросить фильтр</button>
            )}
            <button onClick={exportRows} disabled={rows.length === 0} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-mute hover:text-[#171821] disabled:opacity-40">
              <Download size={14} /> CSV
            </button>
          </div>
        </div>
        <div className="divide-y divide-black/[0.05]">
          {rows.length === 0 && <div className="p-10 text-center text-mute">Нет данных.</div>}
          {rows.slice(0, 100).map((c) => {
            const m = channelMeta(c.source)
            const margin = (c.sale_price || 0) - (c.api_cost || 0)
            return (
              <div key={c.id} className="p-3.5 flex items-center gap-4 text-[13px]">
                <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-lg text-[12px] font-semibold" style={{ background: `${m.color}1a`, color: m.color }}>{m.label}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.plan_id}</div>
                  <div className="text-[11px] text-mute">UDID <code>{c.udid?.slice(0, 10)}…</code> · {dateTime(c.created_at)}</div>
                </div>
                <span className="shrink-0 text-ok text-[12px] tabular-nums">+{money(margin)}</span>
                <span className="shrink-0 font-semibold tabular-nums w-20 text-right">{money(c.sale_price)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FunnelStep({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: `${color}12` }}>
      <div className="text-[22px] font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[12px] text-mute mt-0.5">{label}</div>
    </div>
  )
}
