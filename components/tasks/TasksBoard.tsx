/**
 * components/tasks/TasksBoard.tsx — Kanban board for task management.
 *
 * Four columns: todo / in_progress / review / done.
 * Cards show priority dot, project name, title, deadline, and assignee avatar.
 * Hovering a card reveals quick-move buttons (→ column label).
 * Status changes use optimistic UI — the local state updates immediately and
 * is rolled back with a toast if the DB update fails.
 */

'use client'

import { useState } from 'react'
import { Plus, Calendar, User2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CreateTaskModal } from './CreateTaskModal'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { PRIORITY_COLOR, dueLabel, getInitials, colorFor } from '@/lib/utils'
import type { TaskStatus, TaskPriority } from '@/types'

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo',        label: 'Сделать',  color: '#8B92B4' },
  { key: 'in_progress', label: 'В работе', color: '#1472F5' },
  { key: 'review',      label: 'Проверка', color: '#F59E0B' },
  { key: 'done',        label: 'Готово',   color: '#22C55E' },
]

/** Shape of a task row as returned by the tasks page query (exported for reuse). */
export type TaskRow = {
  id: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  due_date?: string | null
  project?: { id: string; name: string; color: string; emoji?: string } | null
  assignee?: { id: string; full_name: string } | null
}

type ProjectOption = { id: string; name: string; color: string }
type UserOption    = { id: string; full_name: string }

interface Props {
  initialTasks: TaskRow[]
  projects: ProjectOption[]
  users: UserOption[]
}

export function TasksBoard({ initialTasks, projects, users }: Props) {
  const [tasks,         setTasks]         = useState<TaskRow[]>(initialTasks)
  const [showCreate,    setShowCreate]    = useState(false)
  const [filterProject, setFilterProject] = useState('')
  const [filterPriority,setFilterPriority]= useState('')
  const supabase  = createClient()
  const addToast  = useUIStore(s => s.addToast)

  const changeStatus = async (taskId: string, newStatus: TaskStatus) => {
    // Save old status so we can roll back if the DB update fails.
    const oldStatus = tasks.find(t => t.id === taskId)?.status
    if (!oldStatus) return

    // Optimistic update — update UI before waiting for the network.
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)

    if (error) {
      // Revert to previous status and notify the user.
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: oldStatus } : t))
      addToast('Ошибка', 'Не удалось обновить статус задачи', 'err')
    }
  }

  const filtered = tasks.filter(t => {
    if (filterProject  && t.project?.id !== filterProject)  return false
    if (filterPriority && t.priority !== filterPriority)    return false
    return true
  })

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-line bg-white/[0.02] hover:bg-white/[0.04] text-[13px] text-mute hover:text-white transition-all outline-none"
          >
            <option value="">Все проекты</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-line bg-white/[0.02] hover:bg-white/[0.04] text-[13px] text-mute hover:text-white transition-all outline-none"
          >
            <option value="">Любой приоритет</option>
            <option value="urgent">Срочно</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Новая задача
        </Button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.key)
          return (
            <div key={col.key} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-[13px] font-semibold tracking-tight">{col.label}</span>
                </div>
                <span className="text-[11px] text-mute2 font-mono bg-white/[0.04] px-2 h-5 rounded-md inline-flex items-center">
                  {colTasks.length}
                </span>
              </div>
              <div className="h-1 w-full rounded-full" style={{ background: `${col.color}30` }}>
                <div className="h-full rounded-full transition-all" style={{ background: col.color, width: colTasks.length > 0 ? '100%' : '0%' }} />
              </div>

              {/* Task cards */}
              <div className="space-y-2.5 min-h-[80px]">
                {colTasks.length === 0 && (
                  <div className="text-center py-6 text-mute text-[12.5px] border border-dashed border-line rounded-xl">
                    Нет задач
                  </div>
                )}
                {colTasks.map(task => (
                  <div key={task.id} className="card card-tight p-4 hover:border-line2 transition-all cursor-default group">
                    {/* Priority dot + project */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[task.priority] }} />
                      {task.project && (
                        <span className="text-[11px] text-mute2 truncate flex items-center gap-1">
                          {task.project.emoji && <span>{task.project.emoji}</span>}
                          {task.project.name}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="text-[13.5px] font-medium leading-snug mb-3">{task.title}</div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11.5px] text-mute2">
                        <Calendar size={11} />
                        <span>{dueLabel(task.due_date)}</span>
                      </div>
                      {task.assignee ? (
                        <Avatar
                          initials={getInitials(task.assignee.full_name)}
                          color={colorFor(task.assignee.full_name)}
                          size={22}
                        />
                      ) : (
                        <div className="w-5.5 h-5.5 rounded-full bg-white/[0.06] border border-line inline-flex items-center justify-center">
                          <User2 size={10} className="text-mute2" />
                        </div>
                      )}
                    </div>

                    {/* Status change (hover) */}
                    <div className="mt-2.5 pt-2.5 border-t border-line opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1 flex-wrap">
                        {COLUMNS.filter(c => c.key !== col.key).map(c => (
                          <button key={c.key}
                            onClick={() => changeStatus(task.id, c.key)}
                            className="text-[10.5px] px-2 h-5 rounded-md border border-line hover:border-line2 text-mute hover:text-white transition-all"
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showCreate && (
        <CreateTaskModal
          projects={projects}
          users={users}
          onClose={() => setShowCreate(false)}
          onCreated={task => setTasks(prev => [task, ...prev])}
        />
      )}
    </>
  )
}
