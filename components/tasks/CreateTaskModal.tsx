/**
 * components/tasks/CreateTaskModal.tsx — Modal form for creating a new task.
 *
 * On submit, inserts a row in the `tasks` table and calls `onCreated` with the
 * full row (including joined project and assignee) so the board can prepend it
 * without a page reload.
 */

'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { TaskRow } from './TasksBoard'
import type { TaskPriority, TaskStatus } from '@/types'

interface ProjectOption { id: string; name: string; color: string }
interface UserOption    { id: string; full_name: string }

interface Props {
  projects: ProjectOption[]
  users: UserOption[]
  onClose: () => void
  /** Called with the newly created task row after a successful insert. */
  onCreated: (task: TaskRow) => void
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Низкий'  },
  { value: 'medium', label: 'Средний' },
  { value: 'high',   label: 'Высокий' },
  { value: 'urgent', label: 'Срочно'  },
]

const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const SELECT = 'w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all'
const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

export function CreateTaskModal({ projects, users, onClose, onCreated }: Props) {
  const { user } = useAuthStore()
  const supabase = createClient()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [priority,    setPriority]    = useState<TaskPriority>('medium')
  const [projectId,   setProjectId]   = useState('')
  const [assigneeId,  setAssigneeId]  = useState(user?.id ?? '')
  const [dueDate,     setDueDate]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const create = async () => {
    if (!title.trim()) { setError('Название обязательно'); return }
    if (!user) return
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('tasks')
      .insert({
        title:         title.trim(),
        description:   description.trim() || null,
        priority,
        status:        'todo' as TaskStatus,
        creator_id:    user.id,
        assignee_id:   assigneeId || null,
        project_id:    projectId  || null,
        due_date:      dueDate    || null,
        points_reward: 10,
      })
      .select('*, project:projects(id, name, color, emoji), assignee:users!assignee_id(id, full_name)')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onCreated(data)
    onClose()
  }

  return (
    <Modal
      title="Новая задача"
      onClose={onClose}
      maxWidth="max-w-[480px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={create} disabled={saving}>
            {saving && <Loader2 size={15} className="animate-spin" />} Создать
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Название *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Что нужно сделать?" autoFocus className={FIELD} />
        </div>

        <div>
          <label className={LABEL}>Описание</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Подробности…" rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Приоритет</label>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={SELECT}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Срок</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={SELECT} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Проект</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className={SELECT}>
              <option value="">Без проекта</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Исполнитель</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={SELECT}>
              <option value="">Не назначен</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  )
}
