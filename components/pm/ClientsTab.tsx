'use client'

import { useMemo, useState } from 'react'
import { Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fmtRub } from '@/lib/utils'
import type { PMClient } from './types'

interface Props {
  clients: PMClient[]
}

type SortKey = 'total_spent' | 'order_count' | 'last_order_at' | 'created_at'

// RFC 4180 CSV cell escaping
function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

export function ClientsTab({ clients }: Props) {
  const [source, setSource] = useState<'all' | 'pixel' | 'new'>('all')
  const [search, setSearch] = useState('')
  const [sort,   setSort]   = useState<SortKey>('total_spent')

  // Single-pass stats — avoids 3 separate .filter()/.reduce() chains
  const stats = useMemo(() => {
    let pixelCount = 0, newCount = 0, totalRev = 0
    for (const c of clients) {
      if (c.source === 'pixel') pixelCount++
      else if (c.source === 'new') newCount++
      totalRev += Number(c.total_spent)
    }
    return { pixelCount, newCount, totalRev }
  }, [clients])

  const filtered = useMemo(() => {
    let list = clients
    if (source !== 'all') list = list.filter(c => c.source === source)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.email.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      if (sort === 'last_order_at' || sort === 'created_at') {
        return (b[sort] ?? '').localeCompare(a[sort] ?? '')
      }
      return (b[sort] as number) - (a[sort] as number)
    })
  }, [clients, source, search, sort])

  const exportCsv = () => {
    const header = 'email,name,source,orders,total_spent,last_order'
    const rows   = filtered.map(c =>
      [
        csvCell(c.email),
        csvCell(c.name),
        csvCell(c.source),
        c.order_count,
        c.total_spent,
        c.last_order_at ?? '',
      ].join(',')
    )
    // BOM ensures Excel opens UTF-8 correctly without re-encoding dialog
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `pm_clients_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-[11px] text-mute2 uppercase tracking-wider font-semibold mb-1">Всего клиентов</div>
          <div className="text-[24px] font-bold">{clients.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] text-mute2 uppercase tracking-wider font-semibold mb-1">База Пиксель</div>
          <div className="text-[24px] font-bold text-accent">{stats.pixelCount}</div>
          <div className="text-[11px] text-mute">+ {stats.newCount} новых</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] text-mute2 uppercase tracking-wider font-semibold mb-1">Общая выручка</div>
          <div className="text-[24px] font-bold text-ok tabular-nums">{fmtRub(stats.totalRev)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute2 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по email или имени..."
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2"
          />
        </div>

        {(['all', 'pixel', 'new'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`h-9 px-4 rounded-xl border text-[12.5px] font-medium transition-colors
              ${source === s ? 'bg-accent/20 border-accent/40 text-accent' : 'border-line text-mute hover:text-slate-800'}`}
          >
            {s === 'all'   ? `Все (${clients.length})`
             : s === 'pixel' ? `Пиксель (${stats.pixelCount})`
             : `Новые (${stats.newCount})`}
          </button>
        ))}

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="h-9 px-3 rounded-xl bg-bg border border-line outline-none text-[12.5px] text-mute"
        >
          <option value="total_spent">По сумме</option>
          <option value="order_count">По заказам</option>
          <option value="last_order_at">По последнему заказу</option>
          <option value="created_at">По дате регистрации</option>
        </select>

        <Button size="sm" variant="ghost" onClick={exportCsv} title={`Экспорт ${filtered.length} клиентов в CSV`}>
          <Download size={13} /> CSV ({filtered.length})
        </Button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold">Клиент</th>
              <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold hidden sm:table-cell">Источник</th>
              <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold">Заказов</th>
              <th className="px-4 py-3 text-right text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold">Потратил</th>
              <th className="px-4 py-3 text-right text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold hidden md:table-cell">Последний заказ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-mute text-[12.5px]">
                  {clients.length === 0 ? 'Клиентов пока нет' : 'Ничего не найдено'}
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-black/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="text-[13.5px] font-medium">{c.email}</div>
                  {c.name && <div className="text-[11.5px] text-mute">{c.name}</div>}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`text-[11px] font-bold px-2 h-5 rounded-full inline-flex items-center
                    ${c.source === 'pixel' ? 'bg-accent/20 text-accent' : 'bg-black/[0.06] text-mute'}`}>
                    {c.source === 'pixel' ? 'Пиксель' : 'Новый'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[13.5px] font-semibold tabular-nums">{c.order_count}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-[14px] font-bold tabular-nums ${c.total_spent > 0 ? 'text-ok' : 'text-mute'}`}>
                    {c.total_spent > 0 ? fmtRub(Number(c.total_spent)) : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[11.5px] text-mute hidden md:table-cell">
                  {c.last_order_at
                    ? new Date(c.last_order_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
