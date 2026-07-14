/**
 * components/tasks/TasksBoard.tsx — Kanban board for task management.
 *
 * Four columns: todo / in_progress / review / done.
 * Cards show priority dot, project name, title, deadline, and assignee avatar.
 * Hovering a card reveals quick-move buttons (→ column label).
 * Status changes use optimistic UI — the local state updates immediately and
 * is rolled back with a toast if the DB update fails.
 *
 * Drag & drop: DndContext + useDraggable (cards) + useDroppable (columns).
 * Dragged card goes semi-transparent; target column highlights.
 */

'use client'

import { useMemo, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Calendar, User2 } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskDetailModal } from './TaskDetailModal'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { useAuthStore } from '@/store/auth'
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

// ─── Draggable card wrapper ───────────────────────────────────────────────────

interface DraggableCardProps {
  id: string
  children: React.ReactNode
}

function DraggableCard({ id, children }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}
    >
      {children}
    </div>
  )
}

// ─── Droppable column wrapper ─────────────────────────────────────────────────

interface DroppableColumnProps {
  id: TaskStatus
  isOver: boolean
  children: React.ReactNode
}

function DroppableColumn({ id, isOver, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className="space-y-2.5 min-h-[80px] rounded-xl transition-colors duration-150"
      style={isOver ? { background: 'rgba(20,114,245,0.03)', outline: '1.5px dashed rgba(20,114,245,0.25)' } : undefined}
    >
      {children}
    </div>
  )
}

// ─── Main board ──────────────────────────────────────────────────────────────

export function TasksBoard({ initialTasks, projects, users }: Props) {
  const { user } = useAuthStore()
  const [tasks,         setTasks]         = useState<TaskRow[]>(initialTasks)
  const [showCreate,    setShowCreate]    = useState(false)
  const [filterProject, setFilterProject] = useState('')
  const [filterPriority,setFilterPriority]= useState('')
  const [onlyMyTasks,   setOnlyMyTasks]   = useState(false)
  const [overColumn,    setOverColumn]    = useState<TaskStatus | null>(null)
  const [selectedTask,  setSelectedTask]  = useState<TaskRow | null>(null)
  const supabase  = createClient()
  const addToast  = useUIStore(s => s.addToast)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const taskId = searchParams.get('task')
    if (taskId && !selectedTask) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        setSelectedTask(task)
        const url = new URL(window.location.href)
        url.searchParams.delete('task')
        window.history.replaceState({}, '', url)
      } else {
        supabase
          .from('tasks')
          .select('id, title, priority, status, due_date, project:projects(id, name, color, emoji), assignee:users!assignee_id(id, full_name)')
          .eq('id', taskId)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedTask(data as unknown as TaskRow)
              const url = new URL(window.location.href)
              url.searchParams.delete('task')
              window.history.replaceState({}, '', url)
            }
          })
      }
    }
  }, [searchParams, tasks, selectedTask, supabase])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragOver({ over }: DragOverEvent) {
    if (over && COLUMNS.some(c => c.key === over.id)) {
      setOverColumn(over.id as TaskStatus)
    } else {
      setOverColumn(null)
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setOverColumn(null)
    if (!over) return
    const newStatus = over.id as TaskStatus
    const task = tasks.find(t => t.id === active.id)
    if (!task || task.status === newStatus) return
    changeStatus(task.id, newStatus)
  }

  function handleDragCancel() {
    setOverColumn(null)
  }

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

  // Memoised so the filter only re-runs when the task list or filters change.
  const filtered = useMemo(() => tasks.filter(t => {
    if (filterProject  && t.project?.id !== filterProject)  return false
    if (filterPriority && t.priority !== filterPriority)    return false
    if (onlyMyTasks && t.assignee?.id !== user?.id)         return false
    return true
  }), [tasks, filterProject, filterPriority, onlyMyTasks, user?.id])

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Segmented Control for All / My tasks */}
          <div className="flex bg-[#E8E9F3]/50 p-1 rounded-xl">
            <button
              onClick={() => setOnlyMyTasks(false)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                !onlyMyTasks
                  ? 'bg-card text-[#171821] shadow-sm'
                  : 'text-mute hover:text-[#171821]'
              }`}
            >
              Все задачи
            </button>
            <button
              onClick={() => setOnlyMyTasks(true)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                onlyMyTasks
                  ? 'bg-card text-[#171821] shadow-sm'
                  : 'text-mute hover:text-[#171821]'
              }`}
            >
              Мои задачи
            </button>
          </div>

          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-line bg-card hover:bg-bg text-[13px] text-mute hover:text-[#171821] transition-all outline-none"
          >
            <option value="">Все проекты</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-line bg-card hover:bg-bg text-[13px] text-mute hover:text-[#171821] transition-all outline-none"
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
      <DndContext
        sensors={sensors}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.key)
            const isOver   = overColumn === col.key
            return (
              <div key={col.key} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-[13px] font-semibold tracking-tight">{col.label}</span>
                  </div>
                  <span className="text-[11px] text-mute font-mono bg-[#E8E9F3]/60 px-2 h-5 rounded-lg inline-flex items-center">
                    {colTasks.length}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full" style={{ background: `${col.color}30` }}>
                  <div className="h-full rounded-full transition-all" style={{ background: col.color, width: colTasks.length > 0 ? '100%' : '0%' }} />
                </div>

                {/* Task cards — droppable zone */}
                <DroppableColumn id={col.key} isOver={isOver}>
                  {colTasks.length === 0 && (
                    <div className="text-center py-6 text-mute text-[12.5px] border border-dashed border-line rounded-xl">
                      Нет задач
                    </div>
                  )}
                  {colTasks.map(task => (
                    <DraggableCard key={task.id} id={task.id}>
                      <div
                        onClick={() => setSelectedTask(task)}
                        className="card card-tight p-4 hover:border-line2 transition-all cursor-pointer group"
                      >
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
                            <div className="w-5.5 h-5.5 rounded-full bg-bg border border-line inline-flex items-center justify-center">
                              <User2 size={10} className="text-mute" />
                            </div>
                          )}
                        </div>

                        {/* Status change (hover) — kept for keyboard/mouse users */}
                        <div className="mt-2.5 pt-2.5 border-t border-line opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1 flex-wrap">
                            {COLUMNS.filter(c => c.key !== col.key).map(c => (
                              <button key={c.key}
                                onClick={e => { e.stopPropagation(); changeStatus(task.id, c.key) }}
                                onMouseDown={e => e.stopPropagation()}
                                onTouchStart={e => e.stopPropagation()}
                                className="text-[10.5px] px-2 h-5 rounded-lg border border-line hover:border-line2 text-mute hover:text-[#171821] hover:bg-bg transition-all"
                              >
                                → {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DraggableCard>
                  ))}
                </DroppableColumn>
              </div>
            )
          })}
        </div>
      </DndContext>

      {showCreate && (
        <CreateTaskModal
          projects={projects}
          users={users}
          onClose={() => setShowCreate(false)}
          onCreated={task => setTasks(prev => [task, ...prev])}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projects={projects}
          users={users}
          onClose={() => setSelectedTask(null)}
          onUpdated={updatedTask => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
            setSelectedTask(null)
          }}
          onDeleted={taskId => {
            setTasks(prev => prev.filter(t => t.id !== taskId))
            setSelectedTask(null)
          }}
        />
      )}
    </>
  )
}
