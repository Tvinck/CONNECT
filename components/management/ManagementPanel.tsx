'use client'

import { useState } from 'react'
import { UserPlus, X, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { colorFor, getInitials } from '@/lib/utils'
import type { UserRole } from '@/types'

const SECTIONS = ['Дашборд', 'Задачи', 'Проекты', 'База знаний', 'CRM', 'Заказы', 'Финансы', 'Чаты', 'Сервисы']
const ROLES_SHORT = ['Дизайн', 'Разработка', 'Продажи', 'Чат/SEO']

const PERM_LABEL = ['—', 'Просмотр', 'Полный']
const PERM_TONE: Record<number, 'mute' | 'accent' | 'ok'> = { 0: 'mute', 1: 'accent', 2: 'ok' }

const DEFAULT_PERMS: Record<string, number[]> = {
  'Дизайн':     [2, 2, 2, 2, 0, 1, 0, 2, 1],
  'Разработка': [2, 2, 2, 2, 0, 1, 0, 2, 2],
  'Продажи':    [2, 2, 1, 1, 2, 2, 1, 2, 1],
  'Чат/SEO':    [2, 2, 1, 2, 1, 1, 0, 2, 2],
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'ceo',     label: 'CEO'         },
  { value: 'design',  label: 'Дизайнер'    },
  { value: 'dev',     label: 'Разработка'  },
  { value: 'sales',   label: 'Продажи'     },
  { value: 'support', label: 'Поддержка'   },
]

interface Employee {
  id: string
  full_name: string
  email: string
  role: string
  status: string
}

interface Props {
  employees: Employee[]
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: (e: Employee) => void }) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [position, setPosition] = useState('')
  const [role,     setRole]     = useState<UserRole>('dev')
  const [sending,  setSending]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')

  const genPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    setPassword(Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
  }

  const send = async () => {
    if (!name.trim())          { setError('Укажите имя и фамилию'); return }
    if (!email.includes('@'))  { setError('Некорректный email'); return }
    if (password.length < 6)   { setError('Пароль минимум 6 символов'); return }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name.trim(), email: email.trim(), password, position: position.trim(), role }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка'); setSending(false); return }
      onInvited({ id: json.id, full_name: name.trim(), email: email.trim().toLowerCase(), role, status: 'offline' })
      setDone(true)
      setTimeout(onClose, 2000)
    } catch {
      setError('Сетевая ошибка. Попробуйте ещё раз.')
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#151829] border border-line rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">Пригласить сотрудника</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-[16px] font-bold mb-1">Сотрудник добавлен!</div>
            <div className="text-[13px] text-mute">{name} может войти: {email} / {password}</div>
            <div className="text-[12px] text-mute2 mt-2">Передайте логин и пароль сотруднику.</div>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Имя и фамилия *</label>
                <input value={name} onChange={e => setName(e.target.value)} autoFocus
                  placeholder="Иван Иванов"
                  className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all" />
              </div>
              <div>
                <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Email *</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ivan@bazzar.group" type="email"
                  className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all" />
              </div>
              <div>
                <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Пароль *</label>
                <div className="flex gap-2">
                  <input value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="минимум 6 символов" type="text"
                    className="flex-1 h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all" />
                  <button type="button" onClick={genPassword}
                    className="px-3 h-10 rounded-xl border border-line bg-white/[0.02] hover:bg-white/[0.05] text-[12px] text-mute hover:text-white transition-all shrink-0">
                    Сгенерировать
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Должность</label>
                <input value={position} onChange={e => setPosition(e.target.value)}
                  placeholder="Менеджер по продажам"
                  className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all" />
              </div>
              <div>
                <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Роль (доступы)</label>
                <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all">
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {error && (
                <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-line">
              <Button variant="ghost" className="flex-1" onClick={onClose} disabled={sending}>Отмена</Button>
              <Button className="flex-1" onClick={send} disabled={sending}>
                {sending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                Добавить
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function ManagementPanel({ employees }: Props) {
  const [showInvite, setShowInvite] = useState(false)
  const [list, setList] = useState<Employee[]>(employees)
  const [perms, setPerms] = useState(DEFAULT_PERMS)

  const cyclePermission = (role: string, sectionIdx: number) => {
    setPerms(prev => {
      const arr  = [...(prev[role] ?? [])]
      arr[sectionIdx] = ((arr[sectionIdx] ?? 0) + 1) % 3
      return { ...prev, [role]: arr }
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-4">
        {/* Employees list */}
        <div className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold tracking-tight">Сотрудники</h3>
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Пригласить
            </Button>
          </div>
          <div className="space-y-2">
            {list.map(e => (
              <div key={e.id} className="card card-tight p-4 flex items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar initials={getInitials(e.full_name)} color={colorFor(e.full_name)} size={36} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card"
                    style={{ background: e.status === 'online' ? '#22C55E' : e.status === 'busy' ? '#F59E0B' : '#5A6188' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{e.full_name}</div>
                  <div className="text-[11.5px] text-mute truncate">{e.email}</div>
                </div>
                <Tag tone="mute">{e.role}</Tag>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions matrix */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold tracking-tight">Матрица доступов</h3>
            <span className="text-[11px] text-mute2">Нажмите ячейку для изменения</span>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold">Раздел</th>
                  {ROLES_SHORT.map(r => (
                    <th key={r} className="text-center px-3 py-3 text-[11px] uppercase tracking-[0.1em] text-mute2 font-semibold">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((sec, si) => (
                  <tr key={sec} className="border-b border-line last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium">{sec}</td>
                    {ROLES_SHORT.map(r => {
                      const val = perms[r]?.[si] ?? 0
                      return (
                        <td key={r} className="px-3 py-3 text-center">
                          <button
                            onClick={() => cyclePermission(r, si)}
                            className="inline-flex hover:scale-105 active:scale-95 transition-transform"
                            title="Нажмите для изменения"
                          >
                            <Tag tone={PERM_TONE[val]}>{PERM_LABEL[val]}</Tag>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={emp => setList(prev => [...prev, emp].sort((a, b) => a.full_name.localeCompare(b.full_name)))}
        />
      )}
    </>
  )
}
