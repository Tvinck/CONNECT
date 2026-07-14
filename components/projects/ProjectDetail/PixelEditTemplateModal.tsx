'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/store/ui'
import { useAuthStore } from '@/store/auth'
import { Upload, Trash2, Loader2, Save } from 'lucide-react'
import { savePixelTemplate, deletePixelTemplate } from '@/app/actions/pixelActions'

interface PixelEditTemplateModalProps {
  template: any
  categories: any[]
  onClose: () => void
  onSaved: (savedTpl: any, isNew: boolean) => void
  onDeleted: (deletedId: string) => void
}

export function PixelEditTemplateModal({
  template,
  categories,
  onClose,
  onSaved,
  onDeleted
}: PixelEditTemplateModalProps) {
  const [title, setTitle] = useState(template.title || '')
  const [description, setDescription] = useState(template.description || '')
  const [src, setSrc] = useState(template.src || '')
  const [mediaType, setMediaType] = useState(template.media_type || 'image')
  const [category, setCategory] = useState(template.category || categories[0]?.slug || 'trends')
  const [modelId, setModelId] = useState(template.model_id || 'kie-face-swap')
  const [sortOrder, setSortOrder] = useState(template.sort_order?.toString() || '10')
  const [prompt, setPrompt] = useState(template.prompt || '')
  const [generationPrompt, setGenerationPrompt] = useState(template.generation_prompt || '')
  const [isActive, setIsActive] = useState(template.is_active !== false)
  const [requiredFilesCount, setRequiredFilesCount] = useState(template.required_files_count?.toString() || '1')
  const [generationCost, setGenerationCost] = useState(template.generation_cost?.toString() || '1')

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const addToast = useUIStore(s => s.addToast)

  const role = useAuthStore(s => s.role)
  const canEdit = role === 'ceo' || role === 'coowner'

  // Style tokens (aligned with connect globals)
  const labelStyle = 'block text-[11px] uppercase tracking-[0.05em] text-mute2 font-bold mb-1.5'
  const inputStyle = 'w-full h-9 px-3 rounded-xl bg-bg/40 border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2 transition-all disabled:opacity-75 disabled:cursor-not-allowed'
  const textareaStyle = 'w-full px-3 py-2 rounded-xl bg-bg/40 border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2 transition-all resize-none disabled:opacity-75 disabled:cursor-not-allowed'

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/projects/pixel/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Ошибка загрузки файла')
      }
      
      setSrc(data.url)
      setMediaType(data.media_type)
      addToast('Успешно', 'Медиафайл загружен в Supabase Storage', 'ok')
    } catch (err: any) {
      console.error(err)
      addToast('Ошибка загрузки', err.message || 'Не удалось загрузить медиа', 'err')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      addToast('Ошибка', 'Введите название шаблона', 'err')
      return
    }
    if (!src.trim()) {
      addToast('Ошибка', 'Загрузите медиафайл для шаблона', 'err')
      return
    }

    setSaving(true)
    const payload = {
      id: template.id,
      title: title.trim(),
      description: description.trim(),
      src: src.trim(),
      media_type: mediaType,
      category,
      model_id: modelId,
      sort_order: parseInt(sortOrder, 10) || 0,
      prompt: prompt.trim(),
      generation_prompt: generationPrompt.trim(),
      is_active: isActive,
      required_files_count: parseInt(requiredFilesCount, 10) || 1,
      generation_cost: parseInt(generationCost, 10) || 1
    }

    try {
      const res = await savePixelTemplate(payload)
      if (res.success) {
        addToast('Успешно', 'Шаблон сохранен в базе данных', 'ok')
        onSaved(payload, template.is_new)
      }
    } catch (err: any) {
      addToast('Ошибка сохранения', err.message || 'Не удалось сохранить шаблон', 'err')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (template.is_new) return
    if (!confirm('Вы уверены, что хотите окончательно удалить этот шаблон?')) return

    setDeleting(true)
    try {
      const res = await deletePixelTemplate(template.id)
      if (res.success) {
        addToast('Успешно', 'Шаблон удален из базы данных', 'ok')
        onDeleted(template.id)
      }
    } catch (err: any) {
      addToast('Ошибка удаления', err.message || 'Не удалось удалить шаблон', 'err')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      title={template.is_new ? 'Добавить новый шаблон' : (canEdit ? `Редактировать: ${template.title}` : `Просмотр шаблона: ${template.title}`)}
      onClose={onClose}
      footer={
        !canEdit ? (
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" className="h-9" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        ) : (
          <div className="flex justify-between items-center gap-2 w-full">
            {!template.is_new && (
              <Button
                variant="ghost"
                className="text-err hover:bg-err/10 border border-err/20 h-9 shrink-0 px-3"
                disabled={deleting || saving}
                onClick={handleDelete}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </Button>
            )}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Button variant="ghost" className="h-9" onClick={onClose} disabled={saving || deleting}>
                Отмена
              </Button>
              <Button className="bg-brand text-[#171821] h-9 px-4" onClick={handleSave} disabled={saving || deleting}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Сохранить
              </Button>
            </div>
          </div>
        )
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Media Upload Box */}
        <div>
          <label className={labelStyle}>Превью медиафайла *</label>
          {src ? (
            <div className="relative aspect-video bg-black/40 rounded-xl overflow-hidden border border-line flex flex-col justify-center items-center group">
              {mediaType === 'video' ? (
                <video src={src} className="w-full h-full object-contain" controls />
              ) : (
                <img src={src} alt="Template media" className="w-full h-full object-contain" />
              )}
              {canEdit && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3.5 py-1.5 text-[12.5px] hover:bg-white/20 transition-all flex items-center gap-1.5 font-semibold">
                    <Upload size={14} /> Заменить файл
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              )}
            </div>
          ) : !canEdit ? (
            <div className="aspect-video bg-bg border border-dashed border-line rounded-xl flex flex-col items-center justify-center gap-2 text-mute select-none">
              <Upload size={24} className="text-mute2" />
              <span className="text-[13px]">Превью отсутствует</span>
            </div>
          ) : (
            <label className={`cursor-pointer aspect-video bg-bg hover:bg-black/[0.02] border-2 border-dashed border-line rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
              {uploading ? (
                <>
                  <Loader2 size={24} className="animate-spin text-accent" />
                  <span className="text-[12px] text-mute">Загрузка файла в Supabase...</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-mute2" />
                  <span className="text-[13px] text-slate-800 font-semibold">Выберите файл (фото/видео)</span>
                  <span className="text-[11px] text-mute2">или перетащите его сюда</span>
                </>
              )}
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>

        {/* Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Название шаблона *</label>
            <input
              className={inputStyle}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Введите название"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className={labelStyle}>Категория шаблона</label>
            <select
              className={inputStyle}
              value={category}
              onChange={e => setCategory(e.target.value)}
              disabled={!canEdit}
            >
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Model & Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelStyle}>Модель AI (model_id)</label>
            <select
              className={inputStyle}
              value={modelId}
              onChange={e => setModelId(e.target.value)}
              disabled={!canEdit}
            >
              <option value="kie-face-swap">Kie Face Swap (kie-face-swap)</option>
              <option value="replicate-flux">Flux Replicate (replicate-flux)</option>
              <option value="runway-gen3">Runway Gen-3 (runway-gen3)</option>
              <option value="kling-video">Kling AI Video (kling-video)</option>
              <option value="sora-video">OpenAI Sora Video (sora-video)</option>
            </select>
          </div>
          <div>
            <label className={labelStyle}>Стоимость (⚡ зарядов)</label>
            <input
              type="number"
              className={inputStyle}
              value={generationCost}
              onChange={e => setGenerationCost(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Sort Order, Required Files & Active */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelStyle}>Порядковый номер</label>
            <input
              type="number"
              className={inputStyle}
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className={labelStyle}>Кол-во исходных файлов</label>
            <input
              type="number"
              className={inputStyle}
              value={requiredFilesCount}
              onChange={e => setRequiredFilesCount(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="isActiveCheck"
              className="w-4 h-4 rounded accent-accent bg-bg/40 border border-line disabled:opacity-75 disabled:cursor-not-allowed"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              disabled={!canEdit}
            />
            <label htmlFor="isActiveCheck" className={`text-[12.5px] font-semibold text-slate-800 select-none ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              Активный шаблон
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelStyle}>Описание</label>
          <textarea
            className={textareaStyle}
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Описание шаблона для пользователей..."
            disabled={!canEdit}
          />
        </div>

        {/* Prompts */}
        <div className="space-y-4">
          <div>
            <label className={labelStyle}>Промпт шаблона (prompt)</label>
            <textarea
              className={textareaStyle}
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Основной промпт (например, 'A handsome man in a suit...')"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className={labelStyle}>Промпт генерации (generation_prompt)</label>
            <textarea
              className={textareaStyle}
              rows={3}
              value={generationPrompt}
              onChange={e => setGenerationPrompt(e.target.value)}
              placeholder="Промпт, отправляемый в AI API..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
