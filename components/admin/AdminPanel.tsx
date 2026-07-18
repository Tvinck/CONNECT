'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Loader2, Edit3 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { auditLog } from '@/lib/audit'
import { colorFor, getInitials } from '@/lib/utils'
import type { UserRole } from '@/types'
import { updateUser } from '@/app/actions/admin'

const SECTIONS = ['Дашборд', 'Задачи', 'Проекты', 'База знаний', 'Идеи', 'CRM', 'Заказы', 'Финансы', 'Чаты', 'Сервисы']
const ROLES_SHORT = ['Дизайн', 'Разработка', 'Продажи', 'Чат/SEO']
const PERM_LABEL = ['—', 'Просмотр', 'Полный']
const PERM_TONE: Record<number, 'mute' | 'accent' | 'ok'> = { 0: 'mute', 1: 'accent', 2: 'ok' }

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

const SKILL_OPTIONS = ['support_lt', 'support_med', 'support_hard']

export interface Employee {
  id: string
  full_name: string
  email: string
  mention_tag: string | null
  role: string
  position: string | null
  skills: string[]
  status: string
  last_seen: string | null
  created_at: string
}

export interface ProjectData {
  id: string
  name: string
}

export interface ProjectMemberData {
  project_id: string
  user_id: string
  role: string
}

interface Props {
  employees: Employee[]
  projects: ProjectData[]
  projectMembers: ProjectMemberData[]
}

const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2 mt-4'

function EmployeeModal({ 
  employee, 
  projects,
  userProjectIds,
  onClose, 
  onSaved 
}: { 
  employee?: Employee; 
  projects: ProjectData[];
  userProjectIds: string[];
  onClose: () => void; 
  onSaved: (e: Employee, pIds: string[]) => void 
}) {
  const [name,       setName]       = useState(employee?.full_name || '')
  const [email,      setEmail]      = useState(employee?.email || '')
  const [mentionTag, setMentionTag] = useState(employee?.mention_tag || '')
  const [password,   setPassword]   = useState('')
  const [position,   setPosition]   = useState(employee?.position || '')
  const [role,       setRole]       = useState<UserRole>((employee?.role as UserRole) || 'dev')
  const [skills,     setSkills]     = useState<string[]>(employee?.skills || [])
  const [projIds,    setProjIds]    = useState<string[]>(userProjectIds)
  
  const [sending,  setSending]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')
  const isEdit = !!employee

  const genPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    setPassword(Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
  }

  const toggleSkill = (s: string) => {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const toggleProj = (id: string) => {
    setProjIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const save = async () => {
    if (!name.trim()) { setError('Укажите имя и фамилию'); return }
    if (!isEdit && !email.includes('@')) { setError('Некорректный email'); return }
    if (!isEdit && password.length < 6) { setError('Пароль минимум 6 символов'); return }
    
    setSending(true)
    setError('')
    
    try {
      if (isEdit) {
        const res = await updateUser(employee.id, {
          full_name: name.trim(),
          mention_tag: mentionTag.trim() || null,
          role,
          position: position.trim() || null,
          skills,
          projectIds: projIds
        })
        if (res.error) {
          setError(res.error)
          setSending(false)
          return
        }
        onSaved({ ...employee, full_name: name.trim(), mention_tag: mentionTag.trim() || null, role, position: position.trim() || null, skills }, projIds)
        onClose()
      } else {
        const res = await fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fullName: name.trim(), 
            email: email.trim(), 
            password, 
            position: position.trim(), 
            mention_tag: mentionTag.trim() || null,
            role,
            skills,
            projects: projIds
          }),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Ошибка'); setSending(false); return }
        
        onSaved({ 
          id: json.id, 
          full_name: name.trim(), 
          email: email.trim().toLowerCase(), 
          mention_tag: mentionTag.trim() || null,
          position: position.trim() || null,
          role, 
          skills,
          status: 'offline',
          last_seen: null,
          created_at: new Date().toISOString()
        }, projIds)
        setDone(true)
      }
    } catch {
      setError('Сетевая ошибка. Попробуйте ещё раз.')
      setSending(false)
    }
  }

  if (done && !isEdit) {
    return (
      <Modal title="Сотрудник добавлен" onClose={onClose} maxWidth="max-w-[440px]">
        <div className="py-6 text-center -mt-2">
          <div className="text-5xl mb-4">🎉</div>
          <div className="text-[17px] font-bold mb-2">Сотрудник добавлен!</div>
          <div className="text-[13px] text-mute mb-1">{name} может войти через:</div>
          <div className="rounded-xl bg-black/[0.04] border border-line px-4 py-3 text-[12.5px] font-mono space-y-1 text-left mt-3">
            <div><span className="text-mute2">Email:</span> {email}</div>
            <div><span className="text-mute2">Пароль:</span> {password}</div>
          </div>
          <div className="text-[12px] text-mute2 mt-3">Передайте эти данные сотруднику.</div>
          <Button className="mt-6 w-full" onClick={onClose}>Закрыть</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title={isEdit ? "Редактировать сотрудника" : "Пригласить сотрудника"}
      onClose={onClose}
      maxWidth="max-w-[480px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={sending}>Отмена</Button>
          <Button className="flex-1" onClick={save} disabled={sending}>
            {sending ? <Loader2 size={15} className="animate-spin" /> : isEdit ? <Edit3 size={15} /> : <UserPlus size={15} />}
            {isEdit ? 'Сохранить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto -mt-2 pr-2">
        <label className={LABEL} style={{ marginTop: 0 }}>Имя и фамилия *</label>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Иван Иванов" className={FIELD} />

        <label className={LABEL}>Email {!isEdit && '*'}</label>
        <input value={email} onChange={e => setEmail(e.target.value)} disabled={isEdit} placeholder="ivan@bazzar.group" type="email" className={`${FIELD} ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`} />

        {!isEdit && (
          <>
            <label className={LABEL}>Пароль *</label>
            <div className="flex gap-2">
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="минимум 6 символов" type="text" className="flex-1 h-10 px-3.5 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all" />
              <button type="button" onClick={genPassword} className="px-3 h-10 rounded-xl border border-line bg-bg hover:bg-black/[0.05] text-[12px] text-mute hover:text-slate-800 transition-all shrink-0">Сгенерировать</button>
            </div>
          </>
        )}

        <label className={LABEL}>Упоминание (Тег)</label>
        <input value={mentionTag} onChange={e => setMentionTag(e.target.value)} placeholder="@ivan" className={FIELD} />

        <label className={LABEL}>Должность</label>
        <input value={position} onChange={e => setPosition(e.target.value)} placeholder="Менеджер по продажам" className={FIELD} />

        <label className={LABEL}>Роль (доступы)</label>
        <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full h-10 px-3 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13px] transition-all">
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <label className={LABEL}>Навыки (Скиллы)</label>
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map(s => (
            <button key={s} onClick={() => toggleSkill(s)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${skills.includes(s) ? 'bg-accent text-white' : 'bg-black/[0.04] text-mute hover:bg-black/[0.08]'}`}>{s}</button>
          ))}
        </div>

        <label className={LABEL}>Доступы к проектам</label>
        <div className="space-y-1.5">
          {projects.map(p => (
            <label key={p.id} className="flex items-center gap-2 text-[13px] cursor-pointer group">
              <input type="checkbox" checked={projIds.includes(p.id)} onChange={() => toggleProj(p.id)} className="w-4 h-4 rounded border-line text-accent focus:ring-accent" />
              <span className="group-hover:text-accent transition-colors">{p.name}</span>
            </label>
          ))}
          {projects.length === 0 && <div className="text-[12px] text-mute">Нет доступных проектов</div>}
        </div>

        {error && <div className="mt-4 text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  )
}

export function AdminPanel({ employees, projects, projectMembers }: Props) {
  const supabase  = createClient()
  const addToast  = useUIStore(s => s.addToast)
  const [editingEmp,    setEditingEmp]    = useState<Employee | 'new' | null>(null)
  
  const [list,          setList]          = useState<Employee[]>(employees)
  const [pMembers,      setPMembers]      = useState<ProjectMemberData[]>(projectMembers)
  
  const [perms,         setPerms]         = useState(DEFAULT_PERMS)
  const [permsLoading,  setPermsLoading]  = useState(true)
  const [savingCells,   setSavingCells]   = useState<Set<string>>(new Set())

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

  const cyclePermission = async (role: string, sectionIdx: number) => {
    const cellKey = `${role}-${sectionIdx}`
    if (savingCells.has(cellKey)) return

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

  const handleSaved = (emp: Employee, newProjIds: string[]) => {
    setList(prev => {
      const existing = prev.find(e => e.id === emp.id)
      if (existing) {
        return prev.map(e => e.id === emp.id ? emp : e)
      } else {
        return [...prev, emp].sort((a, b) => a.full_name.localeCompare(b.full_name))
      }
    })
    
    setPMembers(prev => {
      const filtered = prev.filter(pm => pm.user_id !== emp.id)
      const newMems = newProjIds.map(pid => ({ project_id: pid, user_id: emp.id, role: 'member' }))
      return [...filtered, ...newMems]
    })
    
    addToast('Успех', 'Данные сотрудника сохранены', 'ok')
  }

  return (
    <>
      <div className="flex items-center justify-between mt-8 mb-4">
        <h3 className="text-[17px] font-semibold tracking-tight">Сотрудники</h3>
        <Button size="sm" onClick={() => setEditingEmp('new')}>
          <UserPlus size={14} /> Пригласить
        </Button>
      </div>
      
      <div className="card overflow-x-auto mb-8">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-mute2 uppercase tracking-wider text-[10px] font-semibold">
              <th className="px-4 py-3">Сотрудник</th>
              <th className="px-4 py-3">Должность</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Навыки (Skills)</th>
              <th className="px-4 py-3 text-right">Вход</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map(e => (
              <tr key={e.id} className="hover:bg-black/[0.02] cursor-pointer transition-colors" onClick={() => setEditingEmp(e)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar initials={getInitials(e.full_name)} color={colorFor(e.full_name)} size={32} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card"
                        style={{ background: e.status === 'online' ? '#22C55E' : e.status === 'busy' ? '#F59E0B' : '#5A6188' }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold">{e.full_name}</div>
                      <div className="text-[11px] text-mute">{e.mention_tag || e.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-mute">{e.position || '—'}</td>
                <td className="px-4 py-3"><Tag tone="mute">{e.role}</Tag></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {e.skills.length > 0 ? e.skills.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-black/[0.05] rounded text-[10px] font-medium text-mute">{s}</span>
                    )) : <span className="text-mute">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-mute text-[12px]">
                  {e.last_seen ? new Date(e.last_seen).toLocaleDateString() : 'Никогда'}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-mute text-[13px]">Сотрудников пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
              <tr key={sec} className="border-b border-line last:border-0 hover:bg-black/[0.02] transition-colors">
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

      {editingEmp && (
        <EmployeeModal
          employee={editingEmp === 'new' ? undefined : editingEmp}
          projects={projects}
          userProjectIds={editingEmp === 'new' ? [] : pMembers.filter(pm => pm.user_id === editingEmp.id).map(pm => pm.project_id)}
          onClose={() => setEditingEmp(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
