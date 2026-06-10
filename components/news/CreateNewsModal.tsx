'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { X, Loader2 } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-line w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-line bg-bg/50">
          <h2 className="text-lg font-black tracking-tight">Создать новость</h2>
          <button onClick={onClose} className="p-1.5 text-mute hover:text-text bg-line/50 hover:bg-line rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
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
      </div>
    </div>
  )
}
