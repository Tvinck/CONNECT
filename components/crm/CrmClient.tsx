'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
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

function AddClientModal({ managers, onClose, onCreated }: { managers: ManagerOption[]; onClose: () => void; onCreated: (c: ClientRow) => void }) {
  const supabase = createClient()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [source, setSource]     = useState('')
  const [status, setStatus]     = useState<ClientStatus>('lead')
  const [spent, setSpent]       = useState('')
  const [managerId, setManagerId] = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const create = async () => {
    if (!name.trim()) { setError('Укажите имя клиента'); return }
    setSaving(true)
    setError('')
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

  const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
  const SELECT = 'w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all'
  const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

  return (
    <Modal
      title="Новый клиент"
      onClose={onClose}
      maxWidth="max-w-[460px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={create} disabled={saving}>
            {saving && <Loader2 size={15} className="animate-spin" />} Добавить
          </Button>
        </>
      }
    >
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
    </Modal>
  )
}

interface Props {
  initialClients: ClientRow[]
  managers: ManagerOption[]
}

export function CrmClient({ initialClients, managers }: Props) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients)
  const [showAdd, setShowAdd] = useState(false)

  const counts = {
    lead:   clients.filter(c => c.status === 'lead').length,
    active: clients.filter(c => c.status === 'active').length,
    vip:    clients.filter(c => c.status === 'vip').length,
  }
  const funnel = [
    { label: 'Лиды',     n: counts.lead,   color: '#1472F5' },
    { label: 'Активные', n: counts.active, color: '#22C55E' },
    { label: 'VIP',      n: counts.vip,    color: '#FFC833' },
  ]

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {funnel.map(f => (
          <div key={f.label} className="card p-5 text-center">
            <div className="text-[32px] font-bold tabular-nums" style={{ color: f.color }}>{f.n}</div>
            <div className="text-[12.5px] text-mute mt-1">{f.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-semibold tracking-tight">Все клиенты · {clients.length}</h3>
        <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить клиента</Button>
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
            {clients.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-mute text-[13px]">Клиентов пока нет — добавьте первого</td></tr>
            )}
            {clients.map(c => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar initials={getInitials(c.name)} color={colorFor(c.name)} size={32} />
                    <span className="text-[13.5px] font-medium tracking-tight">{c.name}</span>
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
      </div>

      {showAdd && (
        <AddClientModal
          managers={managers}
          onClose={() => setShowAdd(false)}
          onCreated={c => setClients(prev => [c, ...prev])}
        />
      )}
    </>
  )
}
