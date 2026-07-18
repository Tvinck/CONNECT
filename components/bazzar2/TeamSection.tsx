'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, UserPlus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { getInitials, colorFor } from '@/lib/utils'

interface UserLite { id: string; full_name: string; position?: string | null; role?: string }
interface Member { role: string; user: (UserLite & { status?: string }) | null }
interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  assignee: { id: string; full_name: string } | null
}

const STATUS_COL: { key: string; label: string; color: string }[] = [
  { key: 'todo', label: 'Сделать', color: '#8B92B4' },
  { key: 'in_progress', label: 'В работе', color: '#1472F5' },
  { key: 'review', label: 'Проверка', color: '#F59E0B' },
  { key: 'done', label: 'Готово', color: '#22C55E' },
]
const STATUS_DOT: Record<string, string> = { online: '#22C55E', busy: '#F59E0B', offline: '#8B92B4' }
const PRIORITY: Record<string, { label: string; color: string }> = {
  low: { label: 'Низкий', color: '#8B92B4' },
  medium: { label: 'Средний', color: '#F59E0B' },
  high: { label: 'Высокий', color: '#EF4444' },
}

export function TeamSection({
  projectId,
  members,
  tasks,
  allUsers,
}: {
  projectId: string | null
  members: Member[]
  tasks: Task[]
  allUsers: UserLite[]
}) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { addToast } = useUIStore()
  const [pending, startTransition] = useTransition()

  const [newMemberId, setNewMemberId] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')

  const memberIds = new Set(members.map((m) => m.user?.id).filter(Boolean) as string[])
  const addable = allUsers.filter((u) => !memberIds.has(u.id))

  const guard = () => {
    if (!projectId) { addToast('Проект не найден', undefined, 'err'); return false }
    return true
  }

  const addMember = () => {
    if (!guard() || !newMemberId) return
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: newMemberId, role: 'member' })
        if (error) throw error
        addToast('Участник добавлен', undefined, 'ok')
        setNewMemberId('')
        router.refresh()
      } catch (e: any) { addToast('Ошибка', e.message || '', 'err') }
    })
  }

  const removeMember = (userId: string) => {
    if (!guard()) return
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
        if (error) throw error
        addToast('Участник удалён', undefined, 'ok')
        router.refresh()
      } catch (e: any) { addToast('Ошибка', e.message || '', 'err') }
    })
  }

  const addTask = () => {
    if (!guard()) return
    if (!taskTitle.trim()) { addToast('Введите название задачи', undefined, 'warn'); return }
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.from('tasks').insert({
          project_id: projectId,
          title: taskTitle.trim(),
          assignee_id: taskAssignee || null,
          creator_id: user?.id ?? null,
          status: 'todo',
          priority: taskPriority,
        })
        if (error) throw error
        addToast('Задача создана', undefined, 'ok')
        setTaskTitle(''); setTaskAssignee(''); setTaskPriority('medium')
        router.refresh()
      } catch (e: any) { addToast('Ошибка', e.message || '', 'err') }
    })
  }

  const setTaskStatus = (id: string, status: string) => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
      if (error) addToast('Ошибка', error.message, 'err'); else router.refresh()
    })
  }

  const deleteTask = (id: string) => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) addToast('Ошибка', error.message, 'err'); else router.refresh()
    })
  }

  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-6">
      <h1 className="text-[22px] font-bold tracking-tight">Команда и задачи</h1>

      {/* Команда */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="text-[14px] font-bold">Участники ({members.length})</div>
          <div className="flex items-center gap-2">
            <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} className="b2-input" style={{ minWidth: 200 }}>
              <option value="">— добавить участника —</option>
              {addable.map((u) => <option key={u.id} value={u.id}>{u.full_name}{u.position ? ` · ${u.position}` : ''}</option>)}
            </select>
            <button disabled={pending || !newMemberId} onClick={addMember} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-[#171821] text-[13px] font-semibold disabled:opacity-50">
              <UserPlus size={15} /> Добавить
            </button>
          </div>
        </div>
        {members.length === 0 ? (
          <div className="text-mute text-[13px]">Участников нет. Добавьте — только они (и владельцы) получат доступ к BazzarSerts 2.0.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map((m, i) => {
              const u = m.user
              if (!u) return null
              return (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-black/[0.02] p-3 group">
                  <span className="relative shrink-0 w-10 h-10 rounded-full inline-flex items-center justify-center text-[13px] font-bold text-white" style={{ background: colorFor(u.full_name) }}>
                    {getInitials(u.full_name)}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: STATUS_DOT[u.status || 'offline'] || '#8B92B4' }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] truncate">{u.full_name}</div>
                    <div className="text-[11px] text-mute truncate">{u.position || m.role || u.role}</div>
                  </div>
                  <button onClick={() => removeMember(u.id)} disabled={pending} title="Удалить" className="shrink-0 text-mute hover:text-err opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                    <X size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Добавить задачу */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
        <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Новая задача…" className="b2-input" />
        <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="b2-input">
          <option value="">Без исполнителя</option>
          {members.map((m) => m.user && <option key={m.user.id} value={m.user.id}>{m.user.full_name}</option>)}
        </select>
        <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="b2-input">
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        <button disabled={pending} onClick={addTask} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-ok text-white text-[13px] font-semibold disabled:opacity-50">
          <Plus size={15} /> Задача
        </button>
      </div>

      {/* Доска задач */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[14px] font-bold">Задачи ({tasks.length})</div>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-ok" style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
              </div>
              <span className="text-[12px] text-mute">{doneCount}/{tasks.length} готово</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUS_COL.map((col) => {
            const items = tasks.filter((t) => t.status === col.key)
            return (
              <div key={col.key} className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                  <span className="text-[13px] font-semibold">{col.label}</span>
                  <span className="text-[11px] text-mute">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && <div className="text-[12px] text-mute py-2">—</div>}
                  {items.map((t) => {
                    const pr = PRIORITY[t.priority] || { label: t.priority, color: '#8B92B4' }
                    return (
                      <div key={t.id} className="rounded-xl bg-black/[0.03] p-2.5 group">
                        <div className="flex items-start gap-2">
                          <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: pr.color }} title={pr.label} />
                          <div className="text-[12.5px] font-medium leading-snug flex-1">{t.title}</div>
                          <button onClick={() => deleteTask(t.id)} disabled={pending} className="text-mute hover:text-err opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          {t.assignee ? <span className="text-[11px] text-mute truncate">{t.assignee.full_name}</span> : <span className="text-[11px] text-mute/60">—</span>}
                          <select value={t.status} onChange={(e) => setTaskStatus(t.id, e.target.value)} disabled={pending} className="text-[11px] bg-transparent border border-black/[0.08] rounded-lg px-1.5 py-0.5 outline-none">
                            {STATUS_COL.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
