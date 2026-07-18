import type { ReactNode } from 'react'

// ── Форматирование ──────────────────────────────────────────────────────────
export function money(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n || 0)) + ' ₽'
}

export function num(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n || 0)
}

export function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── Каналы продаж ───────────────────────────────────────────────────────────
export interface ChannelMeta {
  label: string
  color: string
}

export function channelMeta(source: string | null | undefined): ChannelMeta {
  const s = (source || '').toLowerCase()
  if (s.includes('avito') || s.includes('авито')) return { label: 'Авито', color: '#00C2FF' }
  if (s.includes('ggsel')) return { label: 'GGSel', color: '#6F4FE8' }
  if (s.includes('digiseller') || s.includes('plati')) return { label: 'Digiseller', color: '#F59E0B' }
  if (s.includes('telegram') || s.includes('bot')) return { label: 'Telegram', color: '#1472F5' }
  if (s.includes('manual') || s.includes('ручн')) return { label: 'Ручная', color: '#22C55E' }
  if (s.includes('site') || s.includes('сайт') || s === '') return { label: 'Сайт', color: '#BFF128' }
  return { label: source || 'Прочее', color: '#8B92B4' }
}

// ── KPI-тайл ────────────────────────────────────────────────────────────────
export function KpiTile({
  label,
  value,
  sub,
  accent,
  icon,
  trend,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: string
  icon?: ReactNode
  trend?: number | null // % изменения к прошлому периоду
}) {
  const showTrend = trend != null && Number.isFinite(trend)
  const up = (trend ?? 0) >= 0
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-mute">{label}</span>
        {icon ? <span style={{ color: accent || '#8B92B4' }}>{icon}</span> : null}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-[26px] font-bold tabular-nums leading-none" style={accent ? { color: accent } : undefined}>
          {value}
        </div>
        {showTrend && (
          <span className="text-[12px] font-semibold tabular-nums leading-none pb-0.5" style={{ color: up ? '#22C55E' : '#EF4444' }}>
            {up ? '▲' : '▼'} {Math.abs(Math.round(trend as number))}%
          </span>
        )}
      </div>
      {sub ? <div className="mt-2 text-[12.5px] text-mute">{sub}</div> : null}
    </div>
  )
}

// ── Мини-бар-чарт (без зависимостей) ────────────────────────────────────────
function shortMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.0', '') + 'м'
  if (n >= 1000) return (n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace('.0', '') + 'к'
  return String(Math.round(n))
}

export function MiniBars({ data, color = '#1472F5', showValues = true }: { data: { label: string; value: number }[]; color?: string; showValues?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
          {showValues && (
            <span className="text-[9px] font-semibold tabular-nums" style={{ color: d.value > 0 ? color : 'transparent' }}>
              {d.value > 0 ? shortMoney(d.value) : '·'}
            </span>
          )}
          <div
            className="w-full rounded-t-md transition-all"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 3 : 0, background: color, opacity: 0.85 }}
            title={`${d.label}: ${Math.round(d.value)} ₽`}
          />
          <span className="text-[9px] text-mute whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
