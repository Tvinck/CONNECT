'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import type { TaskPriority, TaskStatus } from '@/types'

interface ProjectOption { id: string; name: string; color: string }
interface UserOption    { id: string; full_name: string }

interface Props {
  projects: ProjectOption[]
  users: UserOption[]
  onClose: () => void
  onCreated: (task: any) => void
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low',    label: 'Низкий',    color: '#8B92B4' },
  { value: 'medium', label: 'Средний',   color: '#1472F5' },
  { value: 'high',   label: 'Высокий',   color: '#F59E0B' },
  { value: 'urgent', label: 'Срочно',    color: '#EF4444' },
]

export function CreateTaskModal({ projects, users, onClose, onCreated }: Props) {
  const { user } = useAuthStore()
  const supabase = createClient()

  const [title,      setTitle]      = useState('')
  const [description,setDescription]= useState('')
  const [priority,   setPriority]   = useState<TaskPriority>('medium')
  const [projectId,  setProjectId]  = useState('')
  const [assigneeId, setAssigneeId] = useState(user?.id ?? '')
  const [dueDate,    setDueDate]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const create = async () => {
    if (!title.trim()) { setError('Название обязательно'); return }
    if (!user) return
    setSaving(true)
    setError('')
    const { data, error: dbErr } = await supabase
      .from('tasks')
      .insert({
        title:       title.trim(),
        description: description.trim() || null,
        priority,
        status:      'todo' as TaskStatus,
        creator_id:  user.id,
        assignee_id: assigneeId || null,
        project_id:  projectId  || null,
        due_date:    dueDate    || null,
        points_reward: 10,
      })
      .select(`*, project:projects(id, name, color, emoji), assignee:users!assignee_id(id, full_name)`)
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onCreated(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#151829] border border-line rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">Новая задача</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Название *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Что нужно сделать?"
              autoFocus
              className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Подробности…"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Приоритет</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Срок</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Проект</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all"
              >
                <option value="">Без проекта</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Исполнитель</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all"
              >
                <option value="">Не назначен</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={create} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            Создать
          </Button>
        </div>
      </div>
    </div>
  )
}
