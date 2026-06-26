/**
 * components/tasks/TaskDetailModal.tsx — Modal for viewing and editing task details.
 *
 * Fetches description and image_url dynamically on mount to keep lists lightweight.
 * Allows updating title, description, project, assignee, priority, status, and due date.
 * Supports deleting the task with confirmation.
 */

'use client'

import { useEffect, useState } from 'react'
import { Loader2, Trash2, Calendar, User2, Folder, ShieldAlert, Maximize2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { TaskComments } from './TaskComments'
import { useUIStore } from '@/store/ui'
import type { TaskRow } from './TasksBoard'
import type { TaskPriority, TaskStatus } from '@/types'
import { PRIORITY_COLOR, dueLabel, getInitials, colorFor } from '@/lib/utils'

interface ProjectOption { id: string; name: string; color: string }
interface UserOption    { id: string; full_name: string }

interface Props {
  task: TaskRow
  projects: ProjectOption[]
  users: UserOption[]
  onClose: () => void
  onUpdated: (task: TaskRow) => void
  onDeleted: (taskId: string) => void
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Низкий'  },
  { value: 'medium', label: 'Средний' },
  { value: 'high',   label: 'Высокий' },
  { value: 'urgent', label: 'Срочно'  },
]

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo',        label: 'Сделать'  },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review',      label: 'Проверка' },
  { value: 'done',        label: 'Готово'   },
]

const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const SELECT = 'w-full h-10 px-3 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13px] transition-all'
const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

export function TaskDetailModal({ task, projects, users, onClose, onUpdated, onDeleted }: Props) {
  const supabase = createClient()
  const { addToast } = useUIStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Form states
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [projectId, setProjectId] = useState(task.project?.id ?? '')
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 10) : '')
  const [noDueDate, setNoDueDate] = useState(!task.due_date)

  // Lightbox state for image zoom
  const [zoomImage, setZoomImage] = useState(false)

  // While the lightbox is open, Escape closes only the zoom — not the whole task modal.
  // Capture phase + stopPropagation pre-empts the base Modal's Escape listener on document.
  useEffect(() => {
    if (!zoomImage) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setZoomImage(false) }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [zoomImage])

  useEffect(() => {
    let active = true
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('description, image_url')
        .eq('id', task.id)
        .single()

      if (error) {
        addToast('Ошибка', 'Не удалось загрузить описание задачи', 'err')
      } else if (data && active) {
        setDescription(data.description ?? '')
        setImageUrl(data.image_url ?? null)
      }
      setLoading(false)
    }

    fetchDetails()
    return () => { active = false }
  }, [task.id, supabase, addToast])

  const save = async () => {
    if (!title.trim()) {
      addToast('Ошибка', 'Название обязательно', 'warn')
      return
    }
    setSaving(true)
    const finalDueDate = noDueDate ? null : (dueDate || null)

    const { error } = await supabase
      .from('tasks')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        project_id: projectId || null,
        assignee_id: assigneeId || null,
        due_date: finalDueDate,
      })
      .eq('id', task.id)

    setSaving(false)

    if (error) {
      addToast('Ошибка', 'Не удалось сохранить задачу: ' + error.message, 'err')
    } else {
      addToast('Успех', 'Задача обновлена', 'ok')
      
      const selectedProj = projects.find(p => p.id === projectId)
      const selectedUser = users.find(u => u.id === assigneeId)

      onUpdated({
        ...task,
        title: title.trim(),
        priority,
        status,
        due_date: finalDueDate,
        project: selectedProj ? { id: selectedProj.id, name: selectedProj.name, color: selectedProj.color } : null,
        assignee: selectedUser ? { id: selectedUser.id, full_name: selectedUser.full_name } : null,
      })
      onClose()
    }
  }

  const remove = async () => {
    setDeleting(true)
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    setDeleting(false)

    if (error) {
      addToast('Ошибка', 'Не удалось удалить задачу: ' + error.message, 'err')
    } else {
      addToast('Успех', 'Задача удалена', 'ok')
      onDeleted(task.id)
      onClose()
    }
  }

  return (
    <>
      <Modal
        title="Детали задачи"
        onClose={onClose}
        maxWidth="w-[96vw] max-w-[1400px] h-[92vh]"
        footer={
          <div className="flex items-center justify-between w-full">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] text-err font-semibold flex items-center gap-1">
                  <ShieldAlert size={14} /> Удалить задачу?
                </span>
                <Button variant="ghost" className="bg-err/15 text-err hover:bg-err/25 border border-err/20" size="sm" onClick={remove} disabled={deleting}>
                  {deleting ? 'Удаление...' : 'Да'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Нет
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 text-[12.5px] text-mute hover:text-err transition-colors"
              >
                <Trash2 size={14} /> Удалить
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose} disabled={saving}>Отмена</Button>
              <Button onClick={save} disabled={saving || loading}>
                {saving && <Loader2 size={15} className="animate-spin" />} Сохранить
              </Button>
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-mute">
            <Loader2 size={24} className="animate-spin text-accent" />
            <span className="text-[13px]">Загрузка деталей...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-2">
            
            {/* Left side: Main Fields */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className={LABEL}>Название</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Название задачи"
                  className={FIELD}
                />
              </div>

              <div>
                <label className={LABEL}>Описание</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Добавьте описание этой задачи..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13.5px] placeholder:text-mute2 transition-all resize-none min-h-[120px]"
                />
              </div>

              {/* Attached Image Section */}
              {imageUrl && (
                <div>
                  <label className={LABEL}>Прикрепленный скриншот</label>
                  <div className="relative group rounded-xl border border-line overflow-hidden bg-bg max-h-[160px] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Вложение к задаче"
                      className="max-h-[160px] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoomImage(true)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1 text-[12.5px] font-semibold"
                      >
                        <Maximize2 size={14} /> Увеличить
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Meta options */}
            <div className="space-y-4 md:border-l md:border-line md:pl-5">
              <div>
                <label className={LABEL}>Статус</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                  className={SELECT}
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>Приоритет</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                  className={SELECT}
                >
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>Проект</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className={SELECT}
                >
                  <option value="">Без проекта</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>Исполнитель</label>
                <select
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  className={SELECT}
                >
                  <option value="">Не назначен</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold">Срок</label>
                  <label className="flex items-center gap-1.5 text-[11.5px] text-mute cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noDueDate}
                      onChange={e => {
                        setNoDueDate(e.target.checked)
                        if (e.target.checked) setDueDate('')
                      }}
                      className="rounded border-line bg-bg text-accent focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                    />
                    Без срока
                  </label>
                </div>
                {!noDueDate && (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={FIELD}
                  />
                )}
              </div>
            </div>

            {/* Bottom: Comments */}
            <div className="md:col-span-3">
              <TaskComments taskId={task.id} />
            </div>

          </div>
        )}
      </Modal>

      {/* Lightbox Modal */}
      {zoomImage && imageUrl && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setZoomImage(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр изображения"
        >
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setZoomImage(false)}
              aria-label="Закрыть"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            >
              <X size={20} />
            </button>
          </div>
          <div className="max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Скриншот в оригинальном размере"
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
}
