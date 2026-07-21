import Link from 'next/link'
import { TrendingUp, Package, Users, BadgeCheck, MessageSquareWarning, Wallet, Star } from 'lucide-react'
import type { Cert } from '@/lib/bazzar2/load'
import { KpiTile, MiniBars, money, num, channelMeta, dateShort, dateTime } from './kit'

interface OverviewData {
  certs: Cert[]
  users: { id: string; created_at: string }[]
  tickets: { id: string; status: string; admin_reply: string | null; created_at: string; type: string; message: string; udid: string }[]
  reviews: { id: string; author: string; rating: number; text: string; status: string; created_at: string }[]
  pending: { id: string; created_at: string; sale_price: number; source: string; udid: string; plan_id: string; crm_status: string }[]
  manual: { id: string; code: string; platform: string; guarantee_months: number; price: number; status: string; udid: string | null; created_at: string }[]
  orders: { id: string; uniquecode: string; item_name: string; amount: number; source: string; status: string; created_at: string }[]
}

const DAY = 86_400_000

export function OverviewSection({ data }: { data: OverviewData }) {
  const { certs, users, tickets, reviews, pending, orders } = data

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()

  // Данные приходят за 60 дней: делим на текущий период (30д) и прошлый (30–60д).
  const nowMs = Date.now()
  const d30 = nowMs - 30 * DAY
  const d60 = nowMs - 60 * DAY
  const cur = certs.filter((c) => new Date(c.created_at).getTime() >= d30)
  const prev = certs.filter((c) => {
    const t = new Date(c.created_at).getTime()
    return t >= d60 && t < d30
  })
  const curUsers = users.filter((u) => new Date(u.created_at).getTime() >= d30)
  const prevUsers = users.filter((u) => {
    const t = new Date(u.created_at).getTime()
    return t >= d60 && t < d30
  })
  const pctTrend = (c: number, p: number): number | null => (p > 0 ? ((c - p) / p) * 100 : c > 0 ? 100 : null)

  // GGSel orders split by period
  const curOrders = (orders || []).filter((o: any) => new Date(o.created_at).getTime() >= d30)
  const prevOrders = (orders || []).filter((o: any) => {
    const t = new Date(o.created_at).getTime()
    return t >= d60 && t < d30
  })

  const certRevenue30 = cur.reduce((s, c) => s + (c.sale_price || 0), 0)
  const orderRevenue30 = curOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0)
  const revenue30 = certRevenue30 + orderRevenue30
  const cost30 = cur.reduce((s, c) => s + (c.api_cost || 0), 0)
  const margin30 = revenue30 - cost30
  const sales30 = cur.length + curOrders.length
  const prevRevenue = prev.reduce((s, c) => s + (c.sale_price || 0), 0) + prevOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0)
  const revenueTrend = pctTrend(revenue30, prevRevenue)
  const salesTrend = pctTrend(sales30, prev.length + prevOrders.length)
  const usersTrend = pctTrend(curUsers.length, prevUsers.length)
  const todayCerts = cur.filter((c) => new Date(c.created_at).getTime() >= todayMs)
  const todayOrders = curOrders.filter((o: any) => new Date(o.created_at).getTime() >= todayMs)
  const revenueToday = todayCerts.reduce((s, c) => s + (c.sale_price || 0), 0) + todayOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0)
  const avgCheck = sales30 ? revenue30 / sales30 : 0
  const unanswered = tickets.filter((t) => !t.admin_reply).length

  // Разбивка по каналам за 30 дней
  const byChannel = new Map<string, { label: string; color: string; revenue: number; count: number }>()
  for (const c of cur) {
    const m = channelMeta(c.source)
    const ch = byChannel.get(m.label) || { label: m.label, color: m.color, revenue: 0, count: 0 }
    ch.revenue += c.sale_price || 0
    ch.count += 1
    byChannel.set(m.label, ch)
  }
  for (const o of curOrders) {
    const m = channelMeta((o as any).source || 'ggsel')
    const ch = byChannel.get(m.label) || { label: m.label, color: m.color, revenue: 0, count: 0 }
    ch.revenue += (o as any).amount || 0
    ch.count += 1
    byChannel.set(m.label, ch)
  }
  const channels = Array.from(byChannel.values()).sort((a, b) => b.revenue - a.revenue)

  // Выручка по дням (14 дней)
  const bars: { label: string; value: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const day = new Date(todayMs - i * DAY)
    const next = day.getTime() + DAY
    const certVal = cur
      .filter((c) => {
        const t = new Date(c.created_at).getTime()
        return t >= day.getTime() && t < next
      })
      .reduce((s, c) => s + (c.sale_price || 0), 0)
    const orderVal = curOrders
      .filter((o: any) => {
        const t = new Date(o.created_at).getTime()
        return t >= day.getTime() && t < next
      })
      .reduce((s: number, o: any) => s + (o.amount || 0), 0)
    bars.push({ label: dateShort(day.toISOString()), value: certVal + orderVal })
  }

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Обзор</h1>
        <span className="text-[13px] text-mute">за 30 дней</span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Выручка" value={money(revenue30)} sub={`Сегодня: ${money(revenueToday)}`} accent="#1472F5" icon={<Wallet size={18} />} trend={revenueTrend} />
        <KpiTile label="Продажи" value={num(sales30)} sub={`Средний чек ${money(avgCheck)}`} icon={<Package size={18} />} trend={salesTrend} />
        <KpiTile label="Маржа" value={money(margin30)} sub={`Себестоимость ${money(cost30)}`} accent="#22C55E" icon={<TrendingUp size={18} />} />
        <KpiTile label="Новые клиенты" value={num(curUsers.length)} icon={<Users size={18} />} trend={usersTrend} />
        <KpiTile label="На согласовании" value={num(pending.length)} sub={<Link href="/b2/registrations" className="text-accent">Открыть очередь →</Link>} accent="#F59E0B" icon={<BadgeCheck size={18} />} />
        <KpiTile label="Претензии без ответа" value={num(unanswered)} sub={<Link href="/b2/reputation" className="text-accent">Ответить →</Link>} accent="#EF4444" icon={<MessageSquareWarning size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* График выручки */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <div className="text-[14px] font-bold">Выручка по дням</div>
            <div className="text-right">
              <div className="text-[18px] font-bold tabular-nums text-accent leading-none">{money(bars.reduce((s, b) => s + b.value, 0))}</div>
              <div className="text-[11px] text-mute">за 14 дней</div>
            </div>
          </div>
          <MiniBars data={bars} color="#1472F5" />
        </div>

        {/* Каналы */}
        <div className="card p-5">
          <div className="text-[14px] font-bold mb-4">Каналы продаж</div>
          <div className="space-y-3">
            {channels.length === 0 && <div className="text-mute text-[13px]">Нет продаж за период.</div>}
            {channels.map((ch) => {
              const pct = revenue30 ? (ch.revenue / revenue30) * 100 : 0
              return (
                <div key={ch.label}>
                  <div className="flex items-center justify-between text-[13px] mb-1">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: ch.color }} />
                      {ch.label}
                      <span className="text-mute">· {ch.count}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{money(ch.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ch.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ленты */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentCard title="Последние продажи">
          {certs.slice(0, 6).map((c) => {
            const m = channelMeta(c.source)
            return (
              <Row key={c.id} left={<span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: m.color }} />{m.label}</span>} mid={c.plan_id} right={money(c.sale_price)} sub={dateTime(c.created_at)} />
            )
          })}
          {certs.length === 0 && <Empty />}
        </RecentCard>

        <RecentCard title="Очередь регистраций">
          {pending.slice(0, 6).map((c) => (
            <Row key={c.id} left={<code className="text-[11px] text-mute">{c.udid?.slice(0, 8)}…</code>} mid={c.plan_id} right={<span className="text-warn text-[12px] font-semibold">на согласовании</span>} sub={dateTime(c.created_at)} />
          ))}
          {pending.length === 0 && <Empty text="Очередь пуста" />}
        </RecentCard>

        <RecentCard title="Отзывы">
          {reviews.slice(0, 6).map((r) => (
            <Row key={r.id} left={<span className="inline-flex items-center gap-1 text-gold"><Star size={13} fill="currentColor" />{r.rating}</span>} mid={<span className="line-clamp-1">{r.text}</span>} right={<span className="text-mute text-[12px]">{r.author}</span>} sub={dateTime(r.created_at)} />
          ))}
          {reviews.length === 0 && <Empty />}
        </RecentCard>
      </div>
    </div>
  )
}

function RecentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="text-[14px] font-bold mb-3">{title}</div>
      <div className="divide-y divide-black/[0.05]">{children}</div>
    </div>
  )
}

function Row({ left, mid, right, sub }: { left: React.ReactNode; mid: React.ReactNode; right: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="py-2.5 flex items-center gap-3 text-[13px]">
      <div className="shrink-0 w-20">{left}</div>
      <div className="flex-1 min-w-0 truncate">{mid}</div>
      <div className="shrink-0 text-right">
        <div className="font-semibold">{right}</div>
        {sub ? <div className="text-[11px] text-mute">{sub}</div> : null}
      </div>
    </div>
  )
}

function Empty({ text = 'Пока пусто' }: { text?: string }) {
  return <div className="py-6 text-center text-mute text-[13px]">{text}</div>
}
