'use client'

import { useMemo, useState } from 'react'
import { Plus, Loader2, ChevronLeft, ChevronRight, Search, X, Trash2 } from 'lucide-react'

const PAGE_SIZE = 20
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { fmtRub, getInitials, colorFor, timeAgo } from '@/lib/utils'
import type { ClientStatus } from '@/types'

type ClientRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  status: ClientStatus
  total_spent: number
  created_at: string
  manager: { id: string; full_name: string } | null
}
type ManagerOption = { id: string; full_name: string }

const STATUS_TONE: Record<string, 'gold' | 'ok' | 'accent' | 'mute'> = {
  vip: 'gold', active: 'ok', lead: 'accent', churned: 'mute',
}
const STATUS_LABEL: Record<string, string> = {
  vip: 'VIP', active: 'Активный', lead: 'Лид', churned: 'Ушёл',
}
const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'lead', label: 'Лид' }, { value: 'active', label: 'Активный' },
  { value: 'vip', label: 'VIP' }, { value: 'churned', label: 'Ушёл' },
]

// ─── shared form fields ────────────────────────────────────────────────────────

const FIELD  = 'w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const SELECT = 'w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all'
const LABEL  = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

// ─── client form (shared by add + edit) ───────────────────────────────────────

function ClientForm({
  name, setName,
  email, setEmail,
  phone, setPhone,
  source, setSource,
  status, setStatus,
  spent, setSpent,
  managerId, setManagerId,
  managers,
  error,
}: {
  name: string; setName: (v: string) => void
  email: string; setEmail: (v: string) => void
  phone: string; setPhone: (v: string) => void
  source: string; setSource: (v: string) => void
  status: ClientStatus; setStatus: (v: ClientStatus) => void
  spent: string; setSpent: (v: string) => void
  managerId: string; setManagerId: (v: string) => void
  managers: ManagerOption[]
  error: string
}) {
  return (
    <div className="space-y-4 max-h-[55vh] overflow-y-auto">
      <div>
        <label className={LABEL}>Имя клиента *</label>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Анна Сергеева" className={FIELD} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="anna@mail.ru" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Телефон</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+7 900 …" className={FIELD} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Источник</label>
          <input value={source} onChange={e => setSource(e.target.value)} placeholder="WB / Ozon / …" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Оборот, ₽</label>
          <input value={spent} onChange={e => setSpent(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0" inputMode="numeric" className={FIELD} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Статус</label>
          <select value={status} onChange={e => setStatus(e.target.value as ClientStatus)} className={SELECT}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Менеджер</label>
          <select value={managerId} onChange={e => setManagerId(e.target.value)} className={SELECT}>
            <option value="">Не назначен</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </div>
      </div>
      {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
    </div>
  )
}

// ─── add modal ─────────────────────────────────────────────────────────────────

function AddClientModal({ managers, onClose, onCreated }: { managers: ManagerOption[]; onClose: () => void; onCreated: (c: ClientRow) => void }) {
  const supabase = createClient()
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [source,    setSource]    = useState('')
  const [status,    setStatus]    = useState<ClientStatus>('lead')
  const [spent,     setSpent]     = useState('')
  const [managerId, setManagerId] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const create = async () => {
    if (!name.trim()) { setError('Укажите имя клиента'); return }
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('clients')
      .insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        source: source.trim() || null,
        status,
        total_spent: Number(spent) || 0,
        manager_id: managerId || null,
      })
      .select('*, manager:users!manager_id(id, full_name)')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onCreated(data as unknown as ClientRow)
    onClose()
  }

  return (
    <Modal title="Новый клиент" onClose={onClose} maxWidth="max-w-[460px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={create} disabled={saving}>
            {saving && <Loader2 size={15} className="animate-spin" />} Добавить
          </Button>
        </>
      }
    >
      <ClientForm
        name={name} setName={setName}
        email={email} setEmail={setEmail}
        phone={phone} setPhone={setPhone}
        source={source} setSource={setSource}
        status={status} setStatus={setStatus}
        spent={spent} setSpent={setSpent}
        managerId={managerId} setManagerId={setManagerId}
        managers={managers}
        error={error}
      />
    </Modal>
  )
}

// ─── edit modal ────────────────────────────────────────────────────────────────

function EditClientModal({ client, managers, onClose, onUpdated, onDeleted }: {
  client: ClientRow
  managers: ManagerOption[]
  onClose: () => void
  onUpdated: (c: ClientRow) => void
  onDeleted: (id: string) => void
}) {
  const supabase = createClient()
  const [name,          setName]          = useState(client.name)
  const [email,         setEmail]         = useState(client.email ?? '')
  const [phone,         setPhone]         = useState(client.phone ?? '')
  const [source,        setSource]        = useState(client.source ?? '')
  const [status,        setStatus]        = useState<ClientStatus>(client.status)
  const [spent,         setSpent]         = useState(String(client.total_spent || ''))
  const [managerId,     setManagerId]     = useState(client.manager?.id ?? '')
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error,         setError]         = useState('')

  const save = async () => {
    if (!name.trim()) { setError('Укажите имя клиента'); return }
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('clients')
      .update({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        source: source.trim() || null,
        status,
        total_spent: Number(spent) || 0,
        manager_id: managerId || null,
      })
      .eq('id', client.id)
      .select('*, manager:users!manager_id(id, full_name)')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onUpdated(data as unknown as ClientRow)
    onClose()
  }

  const doDelete = async () => {
    setDeleting(true)
    const { error: dbErr } = await supabase.from('clients').delete().eq('id', client.id)
    setDeleting(false)
    if (dbErr) { setError(dbErr.message); return }
    onDeleted(client.id)
    onClose()
  }

  return (
    <Modal title={`Клиент: ${client.name}`} onClose={onClose} maxWidth="max-w-[460px]"
      footer={
        <div className="flex items-center gap-2 w-full">
          {confirmDelete ? (
            <>
              <span className="text-[12.5px] text-err flex-1">Удалить клиента безвозвратно?</span>
              <button
                onClick={doDelete}
                disabled={deleting}
                className="text-[12px] text-err font-semibold px-3 h-9 rounded-xl bg-err/15 hover:bg-err/25 transition-colors disabled:opacity-40"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : 'Удалить'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-[12px] text-mute px-3 h-9 rounded-xl hover:text-white transition-colors">
                Отмена
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="w-9 h-9 rounded-xl border border-line text-mute hover:text-err hover:border-err/30 inline-flex items-center justify-center transition-all disabled:opacity-40"
                aria-label="Удалить клиента"
              >
                <Trash2 size={14} />
              </button>
              <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving && <Loader2 size={15} className="animate-spin" />} Сохранить
              </Button>
            </>
          )}
        </div>
      }
    >
      <ClientForm
        name={name} setName={setName}
        email={email} setEmail={setEmail}
        phone={phone} setPhone={setPhone}
        source={source} setSource={setSource}
        status={status} setStatus={setStatus}
        spent={spent} setSpent={setSpent}
        managerId={managerId} setManagerId={setManagerId}
        managers={managers}
        error={error}
      />
    </Modal>
  )
}

// ─── main component ────────────────────────────────────────────────────────────

interface Props {
  initialClients: ClientRow[]
  managers: ManagerOption[]
}

export function CrmClient({ initialClients, managers }: Props) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<ClientRow | null>(null)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(0)

  // Single-pass funnel counts
  const counts = useMemo(() => {
    const r = { lead: 0, active: 0, vip: 0, churned: 0 }
    for (const c of clients) r[c.status as keyof typeof r] = (r[c.status as keyof typeof r] ?? 0) + 1
    return r
  }, [clients])

  const funnel = [
    { label: 'Лиды',     n: counts.lead,    color: '#1472F5' },
    { label: 'Активные', n: counts.active,  color: '#22C55E' },
    { label: 'VIP',      n: counts.vip,     color: '#FFC833' },
    { label: 'Ушли',     n: counts.churned, color: '#5A6188' },
  ]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.source?.toLowerCase().includes(q)
    )
  }, [clients, search])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageClients = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  )

  const handleSearch = (v: string) => { setSearch(v); setPage(0) }

  const handleUpdated = (updated: ClientRow) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const handleDeleted = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setEditing(null)
  }

  return (
    <>
      {/* Funnel summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {funnel.map(f => (
          <div key={f.label} className="card p-5 text-center">
            <div className="text-[32px] font-bold tabular-nums" style={{ color: f.color }}>{f.n}</div>
            <div className="text-[12.5px] text-mute mt-1">{f.label}</div>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="text-[17px] font-semibold tracking-tight shrink-0">
          Клиенты · {clients.length}
        </h3>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute2 pointer-events-none" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Имя, email, телефон, источник…"
            className="w-full h-9 pl-8 pr-8 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2 transition-all"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute2 hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>
        <Button onClick={() => setShowAdd(true)} className="shrink-0"><Plus size={16} /> Добавить</Button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-mute2">
              <th className="text-left px-5 py-3 font-semibold">Клиент</th>
              <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Источник</th>
              <th className="text-left px-5 py-3 font-semibold">Статус</th>
              <th className="text-right px-5 py-3 font-semibold hidden lg:table-cell">Оборот</th>
              <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Менеджер</th>
              <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Добавлен</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-mute text-[13px]">
                  {clients.length === 0 ? 'Клиентов пока нет — добавьте первого' : 'Ничего не найдено'}
                </td>
              </tr>
            )}
            {pageClients.map(c => (
              <tr
                key={c.id}
                onClick={() => setEditing(c)}
                className="border-b border-line last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar initials={getInitials(c.name)} color={colorFor(c.name)} size={32} />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium tracking-tight truncate">{c.name}</div>
                      {c.email && <div className="text-[11.5px] text-mute2 truncate">{c.email}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[12.5px] text-mute hidden md:table-cell">{c.source ?? '—'}</td>
                <td className="px-5 py-3.5"><Tag tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Tag></td>
                <td className="px-5 py-3.5 text-right text-[13px] font-mono hidden lg:table-cell">
                  {c.total_spent > 0 ? fmtRub(c.total_spent) : '—'}
                </td>
                <td className="px-5 py-3.5 text-[12.5px] text-mute hidden lg:table-cell">{c.manager?.full_name ?? '—'}</td>
                <td className="px-5 py-3.5 text-right text-[12px] text-mute2 font-mono hidden md:table-cell">{timeAgo(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-line">
            <span className="text-[12px] text-mute">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} из {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-7 h-7 rounded-lg border border-line text-mute hover:text-white hover:border-line2 inline-flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              {totalPages <= 7
                ? Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      className={`w-7 h-7 rounded-lg text-[12px] font-semibold transition-all ${
                        i === page ? 'bg-accent text-white' : 'border border-line text-mute hover:text-white hover:border-line2'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))
                : (
                  <span className="px-2 text-[12px] text-mute">
                    стр. {page + 1} / {totalPages}
                  </span>
                )
              }
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-7 h-7 rounded-lg border border-line text-mute hover:text-white hover:border-line2 inline-flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddClientModal
          managers={managers}
          onClose={() => setShowAdd(false)}
          onCreated={c => { setClients(prev => [c, ...prev]); setPage(0) }}
        />
      )}

      {editing && (
        <EditClientModal
          client={editing}
          managers={managers}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
