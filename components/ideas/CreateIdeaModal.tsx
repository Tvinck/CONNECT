'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, X, Image as ImageIcon, Trash2, Link as LinkIcon, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useUIStore } from '@/store/ui'
import type { Idea } from './IdeasClient'

interface ProjectOption { id: string; name: string; color: string; emoji: string | null }
interface TagOption { id: string; name: string }

interface Props {
  projects: ProjectOption[]
  allTags: TagOption[]
  currentUser: { id: string; full_name: string }
  onClose: () => void
  onCreated: (idea: Idea) => void
}

const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const SELECT = 'w-full h-10 px-3 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13.5px] transition-all cursor-pointer'
const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

export function CreateIdeaModal({ projects, allTags, currentUser, onClose, onCreated }: Props) {
  const supabase = createClient()
  const addToast = useUIStore(s => s.addToast)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  
  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Links state
  const [links, setLinks] = useState<string[]>([])
  const [linkInput, setLinkInput] = useState('')

  // Files state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Listen for Clipboard Paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const items = e.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            if (attachedFiles.length >= 3) {
              addToast('Лимит вложений', 'Максимум 3 скриншота', 'warn')
              return
            }
            setAttachedFiles(prev => [...prev, file])
            setPreviews(prev => [...prev, URL.createObjectURL(file)])
            addToast('Изображение вставлено', 'Скриншот прикреплен к идее', 'accent')
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [attachedFiles, addToast])

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    for (let i = 0; i < files.length; i++) {
      if (attachedFiles.length + newFiles.length >= 3) {
        addToast('Лимит вложений', 'Максимум 3 скриншота', 'warn')
        break
      }
      const file = files[i]
      if (file.type.startsWith('image/')) {
        newFiles.push(file)
        newPreviews.push(URL.createObjectURL(file))
      }
    }

    if (newFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...newFiles])
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const deleteFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Tags Handlers
  const handleAddTag = (tagName: string) => {
    const clean = tagName.toLowerCase().replace(/#/g, '').trim()
    if (!clean) return
    if (selectedTags.includes(clean)) {
      setTagInput('')
      return
    }
    setSelectedTags(prev => [...prev, clean])
    setTagInput('')
  }

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tagName))
  }

  // Links Handlers
  const handleAddLink = () => {
    let url = linkInput.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    if (links.includes(url)) {
      setLinkInput('')
      return
    }
    setLinks(prev => [...prev, url])
    setLinkInput('')
  }

  const handleRemoveLink = (url: string) => {
    setLinks(prev => prev.filter(l => l !== url))
  }

  // Submit form
  const create = async () => {
    if (!title.trim()) { setError('Название обязательно'); return }
    if (!description.trim()) { setError('Описание обязательно'); return }
    setSaving(true)
    setError('')

    const fileUrls: string[] = []

    try {
      // 1. Upload attachments to Supabase Storage
      for (const file of attachedFiles) {
        const fileExt = file.name.split('.').pop() || 'png'
        const filePath = `ideas/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('idea-attachments')
          .upload(filePath, file)

        if (uploadErr) {
          throw new Error('Не удалось загрузить изображение: ' + uploadErr.message)
        }

        const { data: publicUrlData } = supabase.storage
          .from('idea-attachments')
          .getPublicUrl(filePath)

        if (publicUrlData?.publicUrl) {
          fileUrls.push(publicUrlData.publicUrl)
        }
      }

      // 2. Resolve tags ids (create tags if not exist)
      const tagIds: string[] = []
      for (const tagName of selectedTags) {
        const { data: existing } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single()

        if (existing) {
          tagIds.push(existing.id)
        } else {
          const { data: newTag, error: tagErr } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select('id')
            .single()

          if (tagErr) throw tagErr
          if (newTag) {
            tagIds.push(newTag.id)
          }
        }
      }

      // 3. Create Idea Row
      const { data: idea, error: dbErr } = await supabase
        .from('ideas')
        .insert({
          title: title.trim(),
          description: description.trim(),
          project_id: projectId || null,
          author_id: currentUser.id,
          attachments: fileUrls,
          links: links,
          status: 'new'
        })
        .select(`
          *,
          project:projects(id, name, color, emoji),
          author:users!author_id(id, full_name),
          comments:idea_comments(id),
          votes:idea_votes(user_id, value)
        `)
        .single()

      if (dbErr) throw dbErr

      // 4. Create tags relations
      if (tagIds.length > 0) {
        const relations = tagIds.map(tid => ({
          idea_id: idea.id,
          tag_id: tid
        }))
        const { error: junctionErr } = await supabase.from('idea_tags').insert(relations)
        if (junctionErr) throw junctionErr
      }

      // Retrieve full idea details including tags for local state update
      const { data: fullIdea } = await supabase
        .from('ideas')
        .select(`
          *,
          project:projects(id, name, color, emoji),
          author:users!author_id(id, full_name),
          idea_tags(tag:tags(id, name)),
          comments:idea_comments(id),
          votes:idea_votes(user_id, value)
        `)
        .eq('id', idea.id)
        .single()

      if (fullIdea) {
        onCreated(fullIdea as unknown as Idea)
        addToast('Успешно', 'Идея предложена', 'ok')
      }
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Произошла ошибка при сохранении идеи')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Предложить идею"
      onClose={onClose}
      maxWidth="w-[95vw] max-w-4xl"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button
            className="flex-1"
            onClick={create}
            disabled={saving}
          >
            {saving && <Loader2 size={15} className="animate-spin mr-1.5" />}
            Создать
          </Button>
        </>
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Title */}
        <div>
          <label className={LABEL}>Заголовок идеи *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Коротко и ясно: какую функцию вы хотите добавить?"
            autoFocus
            className={FIELD}
            disabled={saving}
          />
        </div>

        {/* Description */}
        <div>
          <label className={LABEL}>Описание идеи *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Подробно опишите суть идеи, какую проблему она решает и как она должна работать…"
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[13.5px] placeholder:text-mute2 transition-all resize-none"
            disabled={saving}
          />
        </div>

        {/* Attachments */}
        <div>
          <label className={LABEL}>Изображения / Макеты (макс. 3)</label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {previews.map((src, index) => (
                <div key={index} className="relative group aspect-video rounded-xl border border-line overflow-hidden bg-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Вложение" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => deleteFile(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {attachedFiles.length < 3 && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-dashed border-line bg-bg/50 hover:bg-bg text-[13px] text-mute hover:text-[#171821] transition-all w-full justify-center"
                disabled={saving}
              >
                <ImageIcon size={14} /> Прикрепить скриншот или вставить (Ctrl+V)
              </button>
            </div>
          )}
        </div>

        {/* Links */}
        <div>
          <label className={LABEL}>Ссылки на референсы / файлы</label>
          {links.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {links.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 h-8 rounded-lg bg-bg border border-line text-[12px]">
                  <span className="truncate flex items-center gap-1.5 text-accent font-mono">
                    <LinkIcon size={12} />
                    {link}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              placeholder="https://figma.com/file/..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddLink()
                }
              }}
              className="flex-1 h-9 px-3 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[12.5px]"
              disabled={saving}
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="px-3 h-9 rounded-xl border border-line bg-bg hover:bg-line/50 text-[12px] flex items-center justify-center font-medium"
            >
              Добавить
            </button>
          </div>
        </div>

        {/* Project Link */}
        <div>
          <label className={LABEL}>Связать с проектом</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className={SELECT}
            disabled={saving}
          >
            <option value="">Без проекта</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.emoji ? p.emoji + ' ' : ''}
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Selection */}
        <div>
          <label className={LABEL}>Теги</label>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 border border-accent/25 text-accent text-[11px] font-semibold"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="Введите тег (например: дизайн) и нажмите Enter"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag(tagInput)
                }
              }}
              className="flex-1 h-9 px-3 rounded-xl bg-bg border border-line focus:border-accent outline-none text-[12.5px]"
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => handleAddTag(tagInput)}
              className="px-3 h-9 rounded-xl border border-line bg-bg hover:bg-line/50 text-[12px] text-mute hover:text-[#171821] transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Quick Add Suggestions */}
          {allTags.length > 0 && (
            <div className="mt-2.5">
              <span className="text-[10px] text-slate-500 block mb-1">Рекомендуемые:</span>
              <div className="flex flex-wrap gap-1">
                {allTags
                  .filter(t => !selectedTags.includes(t.name))
                  .slice(0, 7)
                  .map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAddTag(t.name)}
                      className="px-1.5 py-0.5 rounded bg-bg hover:bg-line/50 border border-line text-mute hover:text-[#171821] text-[10.5px]"
                    >
                      +{t.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
