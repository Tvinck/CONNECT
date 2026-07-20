'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Eye, ArrowLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'

interface Article {
  id?: string
  slug: string
  title: string
  description: string | null
  category: string
  cover_url: string | null
  content: string | null
  read_time: string | null
  published: boolean
  published_at: string | null
  created_at?: string
}

const CATEGORIES = ['Гайд', 'Обзор', 'FAQ', 'Новость']

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
function slugify(s: string): string {
  return s.toLowerCase().split('').map((c) => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

const empty: Article = { slug: '', title: '', description: '', category: 'Гайд', cover_url: '', content: '', read_time: '5 мин', published: false, published_at: null }

export function BlogSection({ articles }: { articles: Article[] }) {
  const router = useRouter()
  const { addToast } = useUIStore()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<Article | null>(null)
  const [preview, setPreview] = useState(false)

  const startNew = () => { setEditing({ ...empty }); setPreview(false) }
  const startEdit = (a: Article) => { setEditing({ ...a }); setPreview(false) }

  const save = () => {
    if (!editing) return
    if (!editing.title.trim()) { addToast('Введите заголовок', undefined, 'warn'); return }
    const slug = (editing.slug || slugify(editing.title)).trim()
    startTransition(async () => {
      try {
        const supabase = createClient()
        const payload = {
          slug, title: editing.title.trim(), description: editing.description || null,
          category: editing.category, cover_url: editing.cover_url || null,
          content: editing.content || null, read_time: editing.read_time || null,
          published: editing.published,
          published_at: editing.published ? (editing.published_at || new Date().toISOString()) : null,
        }
        const { error } = editing.id
          ? await supabase.from('bazzar_articles').update(payload).eq('id', editing.id)
          : await supabase.from('bazzar_articles').insert(payload)
        if (error) throw error
        addToast('Статья сохранена', undefined, 'ok')
        setEditing(null)
        router.refresh()
      } catch (e: any) { addToast('Ошибка', e.message || '', 'err') }
    })
  }

  const remove = (id?: string) => {
    if (!id) return
    if (!confirm('Удалить статью?')) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('bazzar_articles').delete().eq('id', id)
      if (error) addToast('Ошибка', error.message, 'err')
      else { addToast('Удалено', undefined, 'ok'); setEditing(null); router.refresh() }
    })
  }

  // ── Редактор ────────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1100px] mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 text-[13px] text-mute hover:text-[#171821]"><ArrowLeft size={15} /> К списку</button>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line text-[13px] font-semibold text-mute hover:text-[#171821]"><Eye size={15} /> {preview ? 'Редактор' : 'Превью'}</button>
            {editing.id && <button onClick={() => remove(editing.id)} disabled={pending} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-err text-[13px] font-semibold disabled:opacity-50"><Trash2 size={15} /> Удалить</button>}
            <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-[#171821] text-[13px] font-semibold disabled:opacity-50"><Check size={15} /> {pending ? 'Сохраняем…' : 'Сохранить'}</button>
          </div>
        </div>

        {preview ? (
          <div className="card p-6">
            <span className="inline-block text-[12px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full mb-3">{editing.category}</span>
            <h1 className="text-[24px] font-bold mb-4">{editing.title || 'Заголовок'}</h1>
            <div className="prose-b2" dangerouslySetInnerHTML={{ __html: editing.content || '<p class="text-mute">Пусто</p>' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
            <div className="card p-5 space-y-4">
              <L label="Заголовок"><input className="b2-inp" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} /></L>
              <L label="URL (slug)"><input className="b2-inp" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="avto из заголовка" /></L>
              <L label="Краткое описание"><textarea className="b2-inp" rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></L>
              <L label="Контент (HTML: <h2>, <h3>, <p>, <ul><li>, <strong>, <a>, <div class=&quot;blog-tip&quot;>)">
                <textarea className="b2-inp font-mono text-[12px]" rows={18} value={editing.content || ''} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              </L>
            </div>
            <div className="space-y-4">
              <div className="card p-4 space-y-3">
                <L label="Категория">
                  <select className="b2-inp" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </L>
                <L label="Время чтения"><input className="b2-inp" value={editing.read_time || ''} onChange={(e) => setEditing({ ...editing, read_time: e.target.value })} placeholder="5 мин" /></L>
                <L label="Обложка (URL)"><input className="b2-inp" value={editing.cover_url || ''} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} /></L>
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="w-4 h-4" />
                  <span className="text-[13px] font-semibold">Опубликовано</span>
                </label>
              </div>
            </div>
          </div>
        )}
        <style>{`.b2-inp{width:100%;background:rgba(0,0,0,0.03);border:1px solid var(--color-line);color:#171821;padding:9px 12px;border-radius:12px;outline:none;font-size:13px}.prose-b2 h2{font-size:1.25rem;font-weight:700;margin:1.2rem 0 .5rem}.prose-b2 h3{font-size:1.05rem;font-weight:700;margin:1rem 0 .4rem}.prose-b2 p{margin:0 0 .8rem;line-height:1.7;color:#444}.prose-b2 ul{padding-left:1.2rem;margin:0 0 .8rem;display:flex;flex-direction:column;gap:.4rem}`}</style>
      </div>
    )
  }

  // ── Список ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Блог <span className="text-mute font-normal text-[15px]">· {articles.length}</span></h1>
        <button onClick={startNew} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-[#171821] text-[13px] font-semibold"><Plus size={16} /> Новая статья</button>
      </div>

      <div className="card divide-y divide-black/[0.05]">
        {articles.length === 0 && <div className="p-10 text-center text-mute">Статей нет. Создайте первую.</div>}
        {articles.map((a) => (
          <button key={a.id} onClick={() => startEdit(a)} className="w-full p-4 flex items-center gap-4 text-left hover:bg-black/[0.02]">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] truncate">{a.title}</div>
              <div className="text-[12px] text-mute truncate">/{a.slug} · {a.category}{a.read_time ? ` · ${a.read_time}` : ''}</div>
            </div>
            <span className={`shrink-0 px-2 py-1 rounded-lg text-[12px] font-semibold ${a.published ? 'bg-ok/15 text-ok' : 'bg-black/[0.06] text-mute'}`}>
              {a.published ? 'Опубликовано' : 'Черновик'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[12px] font-semibold text-mute mb-1.5">{label}</span>{children}</label>
}
