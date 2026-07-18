'use client'

import { useMemo, useState } from 'react'
import { Search, X, Package, Repeat, MessageSquareWarning, Smartphone } from 'lucide-react'
import { money, dateTime, channelMeta } from './kit'

interface BUser { id: string; udid: string; status: string; plan: string | null; last_purchase: string | null; created_at: string; telegram: string | null }
interface Cert { id: string; udid: string; plan_id: string; sale_price: number; source: string; crm_status: string; created_at: string }
interface Sub { id: string; udid: string; app_name: string | null; plan: string; price: number; status: string; expires_at: string | null; created_at: string }
interface Ticket { id: string; udid: string; type: string; message: string; status: string; admin_reply: string | null; created_at: string }

const USER_STATUS: Record<string, { label: string; color: string }> = {
  thinking: { label: 'Думает', color: '#F59E0B' },
  bought: { label: 'Купил', color: '#22C55E' },
}

export function UsersSection({
  users, certs, subs, tickets, manual,
}: {
  users: BUser[]; certs: Cert[]; subs: Sub[]; tickets: Ticket[]; manual: { udid: string; device_model: string | null; platform: string }[]
}) {
  const [q, setQ] = useState('')
  const [openUdid, setOpenUdid] = useState<string | null>(null)

  const certsBy = useMemo(() => groupBy(certs, (c) => c.udid), [certs])
  const subsBy = useMemo(() => groupBy(subs, (s) => s.udid), [subs])
  const ticketsBy = useMemo(() => groupBy(tickets, (t) => t.udid), [tickets])
  const deviceBy = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of manual) if (r.udid && r.device_model && !m.has(r.udid)) m.set(r.udid, r.device_model)
    return m
  }, [manual])

  const ltvOf = (udid: string) => (certsBy.get(udid) ?? []).reduce((s, c) => s + (c.sale_price || 0), 0)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return users
    return users.filter((u) =>
      (u.udid || '').toLowerCase().includes(s) ||
      (u.telegram || '').toLowerCase().includes(s) ||
      (u.plan || '').toLowerCase().includes(s)
    )
  }, [users, q])

  const openUser = openUdid ? users.find((u) => u.udid === openUdid) : null

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-[22px] font-bold tracking-tight">Пользователи <span className="text-mute font-normal text-[15px]">· {users.length}</span></h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: UDID, telegram, тариф" className="w-[260px] h-9 pl-9 pr-3 bg-card border border-line rounded-xl text-[13px] outline-none focus:border-accent" />
        </div>
      </div>

      <div className="card divide-y divide-black/[0.05]">
        {filtered.length === 0 && <div className="p-10 text-center text-mute">Ничего не найдено.</div>}
        {filtered.map((u) => {
          const st = USER_STATUS[u.status] || { label: u.status, color: '#8B92B4' }
          const orders = certsBy.get(u.udid) ?? []
          return (
            <button key={u.id} onClick={() => setOpenUdid(u.udid)} className="w-full p-3.5 flex items-center gap-4 text-left text-[13px] hover:bg-black/[0.02]">
              <span className="shrink-0 w-9 h-9 rounded-xl bg-black/[0.05] inline-flex items-center justify-center"><Smartphone size={16} className="text-mute" /></span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">Клиент <code className="text-mute">{u.udid?.slice(0, 12)}…</code></div>
                <div className="text-[11px] text-mute">{u.telegram ? `@${u.telegram.replace('@', '')} · ` : ''}рег. {dateTime(u.created_at)}</div>
              </div>
              <span className="shrink-0 text-mute">{orders.length} зак.</span>
              <span className="shrink-0 font-semibold tabular-nums w-24 text-right">LTV {money(ltvOf(u.udid))}</span>
              <span className="shrink-0 px-2 py-1 rounded-lg text-[12px] font-semibold" style={{ background: `${st.color}1a`, color: st.color }}>{st.label}</span>
            </button>
          )
        })}
      </div>

      {/* Карточка клиента */}
      {openUser && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-start justify-center overflow-y-auto p-4 sm:p-8" onClick={() => setOpenUdid(null)}>
          <div className="w-full max-w-[720px] bg-card rounded-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-line flex items-start justify-between gap-4">
              <div>
                <div className="text-[18px] font-bold">Клиент</div>
                <code className="text-[12px] text-mute break-all">{openUser.udid}</code>
              </div>
              <button onClick={() => setOpenUdid(null)} className="text-mute hover:text-[#171821]"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Профиль */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Info label="LTV" value={money(ltvOf(openUser.udid))} accent />
                <Info label="Заказов" value={String((certsBy.get(openUser.udid) ?? []).length)} />
                <Info label="Устройство" value={deviceBy.get(openUser.udid) || '—'} />
                <Info label="Статус" value={(USER_STATUS[openUser.status] || { label: openUser.status }).label} />
                <Info label="Telegram" value={openUser.telegram ? `@${openUser.telegram.replace('@', '')}` : '—'} />
                <Info label="Регистрация" value={dateTime(openUser.created_at)} />
                <Info label="Тариф" value={openUser.plan || '—'} />
                <Info label="Посл. покупка" value={openUser.last_purchase ? dateTime(openUser.last_purchase) : '—'} />
              </div>

              <CardBlock icon={<Package size={15} />} title="Заказы (сертификаты)">
                {(certsBy.get(openUser.udid) ?? []).length === 0 && <Empty />}
                {(certsBy.get(openUser.udid) ?? []).map((c) => {
                  const ch = channelMeta(c.source)
                  return (
                    <Line key={c.id}
                      left={<span className="px-1.5 py-0.5 rounded text-[11px] font-semibold" style={{ background: `${ch.color}1a`, color: ch.color }}>{ch.label}</span>}
                      mid={c.plan_id} right={money(c.sale_price)} sub={`${c.crm_status} · ${dateTime(c.created_at)}`} />
                  )
                })}
              </CardBlock>

              <CardBlock icon={<Repeat size={15} />} title="Подписки">
                {(subsBy.get(openUser.udid) ?? []).length === 0 && <Empty />}
                {(subsBy.get(openUser.udid) ?? []).map((s) => (
                  <Line key={s.id} left={<span className="text-mute">{s.plan}</span>} mid={s.app_name || 'Приложение'} right={money(s.price)} sub={`${s.status}${s.expires_at ? ' · до ' + dateTime(s.expires_at) : ''}`} />
                ))}
              </CardBlock>

              <CardBlock icon={<MessageSquareWarning size={15} />} title="Обращения">
                {(ticketsBy.get(openUser.udid) ?? []).length === 0 && <Empty />}
                {(ticketsBy.get(openUser.udid) ?? []).map((t) => (
                  <Line key={t.id} left={<span className="text-mute">{t.type}</span>} mid={t.message} right={<span className={t.admin_reply ? 'text-ok' : 'text-warn'}>{t.admin_reply ? 'отвечено' : 'ждёт'}</span>} sub={dateTime(t.created_at)} />
                ))}
              </CardBlock>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function groupBy<T>(arr: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const it of arr) {
    const k = key(it)
    if (!k) continue
    const cur = m.get(k)
    if (cur) cur.push(it)
    else m.set(k, [it])
  }
  return m
}

function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-black/[0.02] p-3">
      <div className="text-[11px] text-mute uppercase tracking-wide">{label}</div>
      <div className={`text-[14px] font-semibold mt-0.5 break-words ${accent ? 'text-accent' : ''}`}>{value}</div>
    </div>
  )
}
function CardBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[13px] font-bold mb-2"><span className="text-mute">{icon}</span>{title}</div>
      <div className="rounded-2xl border border-line divide-y divide-black/[0.05]">{children}</div>
    </div>
  )
}
function Line({ left, mid, right, sub }: { left: React.ReactNode; mid: React.ReactNode; right: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="p-2.5 flex items-center gap-3 text-[12.5px]">
      <div className="shrink-0 w-16">{left}</div>
      <div className="flex-1 min-w-0 truncate">{mid}</div>
      <div className="shrink-0 text-right"><div className="font-semibold">{right}</div>{sub ? <div className="text-[10.5px] text-mute">{sub}</div> : null}</div>
    </div>
  )
}
function Empty() { return <div className="p-4 text-center text-mute text-[12px]">Нет данных</div> }
