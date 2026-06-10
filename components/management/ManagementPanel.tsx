/**
 * components/management/ManagementPanel.tsx — CEO-only team management view.
 *
 * Two panels:
 *  1. Employee list — live list of team members with avatar, email, and role badge.
 *     New employees can be added via InviteModal which calls POST /api/invite.
 *  2. Access matrix — per-role permission table (None / View / Full).
 *     Clicking a cell cycles the level; changes are persisted to the
 *     `role_permissions` table (migration 0006) with optimistic UI.
 *
 * Sub-components:
 *  - InviteModal — form to create a new employee account.
 *    On success shows the generated credentials in a monospace card
 *    so the CEO can copy them for the new hire.
 */

'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { auditLog } from '@/lib/audit'
import { colorFor, getInitials } from '@/lib/utils'
import type { UserRole } from '@/types'

/** Dashboard sections that appear in the permissions matrix. */
const SECTIONS = ['Дашборд', 'Задачи', 'Проекты', 'База знаний', 'Идеи', 'CRM', 'Заказы', 'Финансы', 'Чаты', 'Сервисы']

/** Column headers — role display names used as DB keys. */
const ROLES_SHORT = ['Дизайн', 'Разработка', 'Продажи', 'Чат/SEO']

const PERM_LABEL = ['—', 'Просмотр', 'Полный']
const PERM_TONE: Record<number, 'mute' | 'accent' | 'ok'> = { 0: 'mute', 1: 'accent', 2: 'ok' }

/** Default permissions — shown while DB loads and used as seed values in migration 0006. */
const DEFAULT_PERMS: Record<string, number[]> = {
  'Дизайн':     [2, 2, 2, 2, 2, 0, 1, 0, 2, 1],
  'Разработка': [2, 2, 2, 2, 2, 0, 1, 0, 2, 2],
  'Продажи':    [2, 2, 1, 1, 2, 2, 2, 1, 2, 1],
  'Чат/SEO':    [2, 2, 1, 2, 2, 1, 1, 0, 2, 2],
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'ceo',     label: 'CEO'         },
  { value: 'coowner', label: 'Совладелец'  },
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

  const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
  const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

  return (
    <Modal
      title="Пригласить сотрудника"
      onClose={onClose}
      maxWidth="max-w-[440px]"
      footer={done ? undefined : (
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={sending}>Отмена</Button>
          <Button className="flex-1" onClick={send} disabled={sending}>
            {sending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Добавить
          </Button>
        </>
      )}
    >
      {done ? (
        <div className="py-6 text-center -mt-2">
          <div className="text-5xl mb-4">🎉</div>
          <div className="text-[17px] font-bold mb-2">Сотрудник добавлен!</div>
          <div className="text-[13px] text-mute mb-1">{name} может войти через:</div>
          <div className="rounded-xl bg-white/[0.04] border border-line px-4 py-3 text-[12.5px] font-mono space-y-1 text-left mt-3">
            <div><span className="text-mute2">Email:</span> {email}</div>
            <div><span className="text-mute2">Пароль:</span> {password}</div>
          </div>
          <div className="text-[12px] text-mute2 mt-3">Передайте эти данные сотруднику.</div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto -mt-2">
          <div>
            <label className={LABEL}>Имя и фамилия *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              placeholder="Иван Иванов" className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="ivan@bazzar.group" type="email" className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Пароль *</label>
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
            <label className={LABEL}>Должность</label>
            <input value={position} onChange={e => setPosition(e.target.value)}
              placeholder="Менеджер по продажам" className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Роль (доступы)</label>
            <select value={role} onChange={e => setRole(e.target.value as UserRole)}
              className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all">
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && (
            <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>
          )}
        </div>
      )}
    </Modal>
  )
}

export function ManagementPanel({ employees }: Props) {
  const supabase  = createClient()
  const addToast  = useUIStore(s => s.addToast)
  const [showInvite,    setShowInvite]    = useState(false)
  const [list,          setList]          = useState<Employee[]>(employees)
  const [perms,         setPerms]         = useState(DEFAULT_PERMS)
  const [permsLoading,  setPermsLoading]  = useState(true)
  // Tracks which cells currently have an in-flight upsert to prevent race conditions.
  const [savingCells,   setSavingCells]   = useState<Set<string>>(new Set())

  // Load persisted permissions on mount; fall back to DEFAULT_PERMS if DB is empty.
  useEffect(() => {
    supabase
      .from('role_permissions')
      .select('role, section, level')
      .then(({ data, error }) => {
        if (error) {
          addToast('Ошибка', 'Не удалось загрузить права доступа', 'err')
        } else if (data && data.length > 0) {
          const loaded: Record<string, number[]> = {}
          for (const r of ROLES_SHORT) {
            loaded[r] = [...(DEFAULT_PERMS[r] ?? Array(SECTIONS.length).fill(0))]
          }
          for (const row of data) {
            const si = SECTIONS.indexOf(row.section)
            if (si >= 0 && loaded[row.role]) {
              loaded[row.role][si] = row.level
            }
          }
          setPerms(loaded)
        }
        setPermsLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Cycle a cell's permission level (0→1→2→0) and persist to DB with rollback on error. */
  const cyclePermission = async (role: string, sectionIdx: number) => {
    const cellKey = `${role}-${sectionIdx}`
    if (savingCells.has(cellKey)) return  // prevent race from rapid clicks

    const prev = perms[role]?.[sectionIdx] ?? 0
    const next = (prev + 1) % 3

    setSavingCells(s => new Set(s).add(cellKey))
    setPerms(p => {
      const arr = [...(p[role] ?? [])]
      arr[sectionIdx] = next
      return { ...p, [role]: arr }
    })

    const { error } = await supabase
      .from('role_permissions')
      .upsert({ role, section: SECTIONS[sectionIdx], level: next, updated_at: new Date().toISOString() })

    setSavingCells(s => { const n = new Set(s); n.delete(cellKey); return n })
    if (!error) auditLog({ action: 'user.role_change', entityType: 'role_permission', meta: { role, section: SECTIONS[sectionIdx], level: next } })

    if (error) {
      setPerms(p => {
        const arr = [...(p[role] ?? [])]
        arr[sectionIdx] = prev
        return { ...p, [role]: arr }
      })
      addToast('Ошибка', 'Не удалось сохранить права доступа', 'err')
    }
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
            <span className="text-[11px] text-mute2">
              {permsLoading ? 'Загрузка…' : 'Нажмите ячейку для изменения'}
            </span>
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
                      const val     = perms[r]?.[si] ?? 0
                      const cellKey = `${r}-${si}`
                      return (
                        <td key={r} className="px-3 py-3 text-center">
                          <button
                            onClick={() => cyclePermission(r, si)}
                            disabled={permsLoading || savingCells.has(cellKey)}
                            className="inline-flex hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
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
