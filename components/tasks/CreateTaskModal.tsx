/**
 * components/tasks/CreateTaskModal.tsx — Modal form for creating a new task.
 *
 * Supports:
 *  1. Creating a task without a deadline (no due date).
 *  2. Attaching files from disk or directly pasting (Ctrl+V) screenshots.
 *  3. In-app image annotation (Paint Canvas) with brush drawing (red, yellow, green, blue),
 *     adding text comments, and undo functionality.
 *  4. Uploading the processed image to Supabase Storage and storing URL.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Calendar, Image as ImageIcon, Undo, Type, Paintbrush, Plus, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useUIStore } from '@/store/ui'
import type { TaskRow } from './TasksBoard'
import type { TaskPriority, TaskStatus } from '@/types'

interface ProjectOption { id: string; name: string; color: string }
interface UserOption    { id: string; full_name: string }

interface Props {
  projects: ProjectOption[]
  users: UserOption[]
  onClose: () => void
  onCreated: (task: TaskRow) => void
  initialProjectId?: string
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Низкий'  },
  { value: 'medium', label: 'Средний' },
  { value: 'high',   label: 'Высокий' },
  { value: 'urgent', label: 'Срочно'  },
]

const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const SELECT = 'w-full h-10 px-3 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13px] transition-all'
const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

export function CreateTaskModal({ projects, users, onClose, onCreated, initialProjectId }: Props) {
  const { user } = useAuthStore()
  const supabase = createClient()
  const { addToast } = useUIStore()

  // Form states
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [priority,    setPriority]    = useState<TaskPriority>('medium')
  const [projectId,   setProjectId]   = useState(initialProjectId ?? '')
  const [assigneeId,  setAssigneeId]  = useState(user?.id ?? '')
  const [dueDate,     setDueDate]     = useState('')
  const [noDueDate,   setNoDueDate]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // Attachment states
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Image editing states
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isEditingImage, setIsEditingImage] = useState(false)
  const [tempImage, setTempImage] = useState<HTMLImageElement | null>(null)
  const [tool, setTool] = useState<'pen' | 'text'>('pen')
  const [brushColor, setBrushColor] = useState('#EF4444') // Default red
  const [brushSize] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)

  // Drawing Undo History
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // 1. Listen for Paste Events (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const items = e.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            handleImageSelected(file)
            addToast('Изображение вставлено', 'Открыт графический редактор', 'accent')
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [addToast])

  // 2. Initialize Canvas when entering image editor
  useEffect(() => {
    if (isEditingImage && tempImage && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Resize canvas to match image, but keep it constrained
      const maxWidth = 580
      const maxHeight = 360
      let w = tempImage.width
      let h = tempImage.height

      if (w > maxWidth) {
        h = (maxWidth / w) * h
        w = maxWidth
      }
      if (h > maxHeight) {
        w = (maxHeight / h) * w
        h = maxHeight
      }

      canvas.width = w
      canvas.height = h
      ctx.drawImage(tempImage, 0, 0, w, h)

      // Initialize drawing settings
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = brushSize
      ctx.strokeStyle = brushColor

      // Save initial state in history
      const initialState = canvas.toDataURL()
      setHistory([initialState])
      setHistoryIndex(0)
    }
  }, [isEditingImage, tempImage, brushSize, brushColor])

  // 3. Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageSelected(file)
    }
  }

  const handleImageSelected = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setTempImage(img)
        setIsEditingImage(true)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // 4. Drawing Canvas logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'text') {
      const text = prompt('Введите комментарий для добавления на холст:')
      if (text && text.trim()) {
        ctx.font = 'bold 15px sans-serif'
        ctx.fillStyle = brushColor
        ctx.fillText(text.trim(), x, y + 5)
        pushState()
      }
      return
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool !== 'pen') return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.strokeStyle = brushColor
    ctx.lineWidth = brushSize
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      pushState()
    }
  }

  const pushState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const nextHistory = [...history.slice(0, historyIndex + 1), canvas.toDataURL()]
    setHistory(nextHistory)
    setHistoryIndex(nextHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex <= 0) return
    const prevIdx = historyIndex - 1
    setHistoryIndex(prevIdx)

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const img = new Image()
    img.src = history[prevIdx]
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
  }

  const clearCanvas = () => {
    if (!tempImage || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height)
    pushState()
  }

  // 5. Finish image editing
  const saveEditedImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'annotated-screenshot.png', { type: 'image/png' })
        setAttachedFile(file)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(blob))
      }
      setIsEditingImage(false)
      setTempImage(null)
    }, 'image/png')
  }

  // 6. Submit task creation to DB
  const create = async () => {
    if (!title.trim()) { setError('Название обязательно'); return }
    if (!user) return
    setSaving(true); setError('')

    let uploadedUrl: string | null = null

    try {
      // 6.1. Upload attachment to Supabase Storage if present
      if (attachedFile) {
        const fileExt = 'png'
        const filePath = `tasks/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('task-attachments')
          .upload(filePath, attachedFile)

        if (uploadErr) {
          throw new Error('Не удалось загрузить скриншот: ' + uploadErr.message)
        }

        const { data: publicUrlData } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(filePath)

        uploadedUrl = publicUrlData?.publicUrl ?? null
      }

      // 6.2. Insert task record
      const finalDueDate = noDueDate ? null : (dueDate || null)
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
          due_date:      finalDueDate,
          points_reward: 10,
          image_url:     uploadedUrl,
        })
        .select('*, project:projects(id, name, color, emoji), assignee:users!assignee_id(id, full_name)')
        .single()

      if (dbErr) throw dbErr

      if (data) {
        onCreated(data as TaskRow)
        addToast('Успешно', 'Задача создана', 'ok')
      }
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Произошла непредвиденная ошибка')
      setSaving(false)
    }
  }

  const deleteAttachment = () => {
    setAttachedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  return (
    <Modal
      title={isEditingImage ? 'Редактирование скриншота' : 'Новая задача'}
      onClose={onClose}
      maxWidth={isEditingImage ? 'w-[95vw] max-w-5xl' : 'w-[95vw] max-w-4xl'}
      footer={
        isEditingImage ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="w-8 h-8 rounded-lg bg-bg border border-line flex items-center justify-center hover:bg-line/60 hover:text-[#171821] text-mute transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                title="Шаг назад"
              >
                <Undo size={14} />
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="px-2.5 h-8 rounded-lg bg-bg border border-line text-[11.5px] font-semibold hover:bg-line/60 hover:text-[#171821] text-mute transition-all"
              >
                Очистить
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsEditingImage(false); setTempImage(null) }}>
                Отмена
              </Button>
              <Button size="sm" onClick={saveEditedImage}>
                Применить
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
            <Button className="flex-1" onClick={create} disabled={saving}>
              {saving && <Loader2 size={15} className="animate-spin" />} Создать
            </Button>
          </>
        )
      }
    >
      {isEditingImage ? (
        // ─── Paint Graphic Editor View ──────────────────────────────────
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-bg border border-line p-2 rounded-xl">
            {/* Draw Tools */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  tool === 'pen' ? 'bg-brand text-[#171821]' : 'text-mute hover:bg-line/60'
                }`}
                title="Рисовать кистью"
              >
                <Paintbrush size={15} />
              </button>
              <button
                type="button"
                onClick={() => setTool('text')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  tool === 'text' ? 'bg-brand text-[#171821]' : 'text-mute hover:bg-line/60'
                }`}
                title="Добавить текст (кликните на холст)"
              >
                <Type size={15} />
              </button>
            </div>

            {/* Colors picker */}
            <div className="flex items-center gap-1.5">
              {['#EF4444', '#F59E0B', '#22C55E', '#1472F5', '#FFFFFF'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBrushColor(color)}
                  className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                    brushColor === color ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {brushColor === color && <div className="w-1.5 h-1.5 rounded-full bg-black/60" />}
                </button>
              ))}
            </div>
          </div>

          {/* HTML5 Canvas */}
          <div className="flex justify-center items-center bg-black/40 border border-line rounded-xl overflow-hidden p-1">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="max-w-full max-h-[380px] object-contain cursor-crosshair rounded-lg"
            />
          </div>

          <div className="text-[11px] text-mute2 text-center -mt-1">
            Зажмите левую кнопку мыши для рисования. Выберите инструмент «Текст» и кликните на холст для надписи.
          </div>
        </div>
      ) : (
        // ─── Main Form View ──────────────────────────────────────────────
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className={LABEL}>Название *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Что нужно сделать?" autoFocus className={FIELD} />
          </div>

          <div>
            <label className={LABEL}>Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Подробности…" rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13.5px] placeholder:text-mute2 transition-all resize-none" />
          </div>

          {/* Attachment Selector & Preview */}
          <div>
            <label className={LABEL}>Скриншот / Макет</label>
            {previewUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-line bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Вложение" className="w-12 h-12 object-cover rounded-lg border border-line" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium truncate">{attachedFile?.name || 'Изображение'}</div>
                  <div className="text-[11px] text-mute font-mono">{(attachedFile?.size ? (attachedFile.size / 1024).toFixed(1) : 0)} KB</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingImage(true)}
                  className="px-2.5 h-7 rounded-lg border border-line text-[11.5px] font-semibold text-mute hover:text-[#171821] hover:bg-line/60 transition-all"
                >
                  Править
                </button>
                <button
                  type="button"
                  onClick={deleteAttachment}
                  className="w-7 h-7 rounded-lg hover:bg-err/10 hover:text-err text-mute2 flex items-center justify-center transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-line bg-bg hover:bg-line/60 text-[13px] text-mute hover:text-[#171821] transition-all w-full justify-center border-dashed"
                >
                  <ImageIcon size={14} /> Прикрепить изображение или вставить (Ctrl+V)
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Приоритет</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={SELECT}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold">Срок</label>
                <label className="flex items-center gap-1.5 text-[11px] text-mute cursor-pointer select-none">
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
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={SELECT} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Проект</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                disabled={!!initialProjectId}
                className={SELECT}
              >
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
      )}
    </Modal>
  )
}
