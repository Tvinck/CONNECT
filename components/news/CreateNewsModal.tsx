'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Modal } from '@/components/ui/Modal'
import { Loader2 } from 'lucide-react'
import { processMentions } from '@/lib/mentions'

export function CreateNewsModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuthStore()
  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !user) return

    setSubmitting(true)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

    const { data, error } = await supabase
      .from('news')
      .insert({
        title: title.trim(),
        content: content.trim(),
        tags: tags,
        author_id: user.id
      })
      .select('id')
      .single()

    if (!error && data) {
      // Process mentions asynchronously
      processMentions(content.trim(), user.id, `/news/${data.id}`, 'в новости')
      onSuccess()
      onClose()
      setTitle('')
      setContent('')
      setTagsInput('')
    }
    setSubmitting(false)
  }

  return (
    <Modal title="Создать новость" onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-bold text-slate-700 ml-1">Заголовок</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="О чем хотите рассказать?"
              className="field w-full text-base font-semibold"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-bold text-slate-700 ml-1">Текст новости (с поддержкой @упоминаний)</label>
            <RichTextEditor 
              value={content}
              onChange={setContent}
              placeholder="Текст новости... Используйте @ для упоминания сотрудников."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-bold text-slate-700 ml-1">Теги (через запятую)</label>
            <input 
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="например: Важное, Баг, Обновление"
              className="field w-full text-sm"
            />
          </div>

          <div className="pt-4 border-t border-line flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={submitting || !title.trim() || !content.trim()}>
              {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Опубликовать
            </Button>
          </div>
      </form>
    </Modal>
  )
}
