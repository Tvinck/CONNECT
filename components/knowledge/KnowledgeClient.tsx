'use client'

import { useMemo, useState } from 'react'
import { Search, Plus, Clock, Eye, X, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import { getInitials, colorFor, timeAgo } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

type Article = {
  id: string
  title: string
  content: string
  category: string
  views: number
  read_time: number
  created_at: string
  author: { id: string; full_name: string } | null
}

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  'Онбординг':   { emoji: '🚀', color: '#1472F5' },
  'Процессы':    { emoji: '⚙️', color: '#6F4FE8' },
  'Инструменты': { emoji: '🛠', color: '#00C2FF' },
  'FAQ':         { emoji: '❓', color: '#FFC833' },
  'Общее':       { emoji: '📄', color: '#8B92B4' },
}
const meta = (c: string) => CATEGORY_META[c] ?? { emoji: '📄', color: '#8B92B4' }
const CATEGORIES = Object.keys(CATEGORY_META)

function readTime(text: string) {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 180))
}

function ArticleView({ article, onClose }: { article: Article; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#151829] border border-line rounded-2xl w-full max-w-[680px] max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <button onClick={onClose} className="flex items-center gap-2 text-[13px] text-mute hover:text-white transition-all">
            <ArrowLeft size={15} /> Назад
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="px-8 py-6 overflow-y-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11px] font-semibold mb-4"
            style={{ background: `${meta(article.category).color}20`, color: meta(article.category).color }}>
            {meta(article.category).emoji} {article.category}
          </div>
          <h1 className="text-[26px] font-bold tracking-tight leading-tight mb-4">{article.title}</h1>
          <div className="flex items-center gap-4 text-[12.5px] text-mute pb-5 mb-5 border-b border-line">
            {article.author && (
              <div className="flex items-center gap-2">
                <Avatar initials={getInitials(article.author.full_name)} color={colorFor(article.author.full_name)} size={24} />
                <span>{article.author.full_name}</span>
              </div>
            )}
            <span className="inline-flex items-center gap-1"><Clock size={12} /> {article.read_time} мин</span>
            <span className="inline-flex items-center gap-1"><Eye size={12} /> {article.views}</span>
            <span>{timeAgo(article.created_at)}</span>
          </div>
          <div className="text-[14.5px] text-white/85 leading-relaxed whitespace-pre-wrap">
            {article.content || 'Статья пока пустая.'}
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateArticleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Article) => void }) {
  const supabase = createClient()
  const { user } = useAuthStore()
  const [title, setTitle]       = useState('')
  const [category, setCategory] = useState('Общее')
  const [content, setContent]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const create = async () => {
    if (!title.trim()) { setError('Укажите заголовок'); return }
    if (!user) return
    setSaving(true)
    setError('')
    const { data, error: dbErr } = await supabase
      .from('knowledge_articles')
      .insert({
        title: title.trim(),
        content: content,
        category,
        author_id: user.id,
        read_time: readTime(content),
      })
      .select('*, author:users!author_id(id, full_name)')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onCreated(data as unknown as Article)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#151829] border border-line rounded-2xl w-full max-w-[680px] max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <h2 className="text-[16px] font-bold tracking-tight">Новая статья</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder="Заголовок статьи"
            className="w-full text-[22px] font-bold tracking-tight bg-transparent outline-none placeholder:text-mute2" />
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium border transition-all ${
                  category === c ? 'border-accent/50 bg-accent/10 text-white' : 'border-line text-mute hover:text-white hover:border-line2'
                }`}>
                {meta(c).emoji} {c}
              </button>
            ))}
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={12}
            placeholder="Текст статьи… Опишите процесс, инструкцию или ответ на частый вопрос."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[14px] leading-relaxed placeholder:text-mute2 transition-all resize-none" />
          {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-line shrink-0">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={create} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            Опубликовать
          </Button>
        </div>
      </div>
    </div>
  )
}

export function KnowledgeClient({ initialArticles }: { initialArticles: Article[] }) {
  const supabase = createClient()
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [query, setQuery]       = useState('')
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [viewing, setViewing]   = useState<Article | null>(null)

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const a of articles) m[a.category] = (m[a.category] ?? 0) + 1
    return m
  }, [articles])

  const filtered = articles.filter(a => {
    if (activeCat && a.category !== activeCat) return false
    if (query && !a.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const openArticle = async (a: Article) => {
    setViewing(a)
    // Increment views (fire and forget).
    const next = a.views + 1
    setArticles(prev => prev.map(x => x.id === a.id ? { ...x, views: next } : x))
    await supabase.from('knowledge_articles').update({ views: next }).eq('id', a.id)
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по статьям…"
            className="w-full h-10 pl-10 pr-3 bg-white/[0.025] border border-line rounded-xl text-[13px] placeholder:text-mute2 focus:border-accent focus:bg-white/[0.04] outline-none transition-all" />
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Новая статья</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {CATEGORIES.filter(c => c !== 'Общее' || catCounts['Общее']).map(cat => (
          <button key={cat}
            onClick={() => setActiveCat(activeCat === cat ? null : cat)}
            className={`card card-tight p-4 text-left cursor-pointer hover:scale-[1.02] transition-transform ${activeCat === cat ? 'border-accent/50' : ''}`}>
            <div className="text-2xl mb-2">{meta(cat).emoji}</div>
            <div className="text-[13.5px] font-semibold tracking-tight">{cat}</div>
            <div className="text-[11px] text-mute mt-1">{catCounts[cat] ?? 0} статей</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-semibold tracking-tight">
          {activeCat ? activeCat : 'Все статьи'} · {filtered.length}
        </h3>
        {activeCat && (
          <button onClick={() => setActiveCat(null)} className="text-[12px] text-mute hover:text-white transition-all">Сбросить фильтр</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-mute text-[13px]">
          {articles.length === 0 ? 'Статей пока нет — создайте первую' : 'Ничего не найдено'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(a => {
            const fresh = Date.now() - new Date(a.created_at).getTime() < 3 * 86400000
            return (
              <button key={a.id} onClick={() => openArticle(a)} className="card p-5 cursor-pointer lift text-left">
                <div className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full text-[10px] font-semibold mb-3"
                  style={{ background: `${meta(a.category).color}20`, color: meta(a.category).color }}>
                  {meta(a.category).emoji} {a.category}
                </div>
                {fresh && (
                  <span className="ml-1.5 inline-flex items-center px-2 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-semibold mb-3">Новое</span>
                )}
                <h4 className="text-[14px] font-semibold tracking-tight leading-snug">{a.title}</h4>
                <div className="flex items-center gap-3 mt-3 text-[11.5px] text-mute">
                  {a.author && (
                    <Avatar initials={getInitials(a.author.full_name)} color={colorFor(a.author.full_name)} size={20} />
                  )}
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {a.read_time} мин</span>
                  <span className="inline-flex items-center gap-1"><Eye size={11} /> {a.views}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {showCreate && <CreateArticleModal onClose={() => setShowCreate(false)} onCreated={a => setArticles(prev => [a, ...prev])} />}
      {viewing && <ArticleView article={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}
