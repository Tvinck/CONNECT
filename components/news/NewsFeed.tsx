'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NewsCard } from './NewsCard'
import { CreateNewsModal } from './CreateNewsModal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'
import { Plus, Loader2, Search, X } from 'lucide-react'

type FilterType = 'all' | 'unread' | 'important' | 'bugs' | 'updates'

const FILTERS: { key: FilterType; label: string; emoji: string }[] = [
  { key: 'all',       label: 'Все',            emoji: '📋' },
  { key: 'unread',    label: 'Непрочитанные',  emoji: '🔵' },
  { key: 'important', label: 'Важное',         emoji: '🔥' },
  { key: 'bugs',      label: 'Баги',           emoji: '🐛' },
  { key: 'updates',   label: 'Обновления',     emoji: '🚀' },
]

export function NewsFeed() {
  const [news, setNews] = useState<any[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const { user } = useAuthStore()
  const supabase = createClient()

  const fetchNews = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('news')
      .select(`
        id, title, content, tags, created_at,
        author:users!author_id(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (data) setNews(data)
    setLoading(false)
  }

  const fetchReads = async () => {
    if (!user) return
    const { data } = await supabase
      .from('news_reads')
      .select('news_id')
      .eq('user_id', user.id)

    if (data) {
      setReadIds(new Set(data.map((r: any) => r.news_id)))
    }
  }

  useEffect(() => {
    fetchNews()
    fetchReads()
  }, [])

  // Подписка на realtime обновления news_reads
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('newsfeed_reads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_reads', filter: `user_id=eq.${user.id}` }, () => {
        fetchReads()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, () => {
        fetchNews()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const canCreateNews = user?.role === 'ceo' || user?.role === 'coowner'

  // Фильтрация
  const filtered = useMemo(() => {
    let result = news

    // Текстовый поиск
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(q)))
      )
    }

    // Фильтр по типу
    switch (activeFilter) {
      case 'unread':
        result = result.filter(n => !readIds.has(n.id))
        break
      case 'important':
        result = result.filter(n =>
          n.tags && n.tags.some((t: string) => /важн|important|срочн/i.test(t))
        )
        break
      case 'bugs':
        result = result.filter(n =>
          n.tags && n.tags.some((t: string) => /баг|bug|ошибк/i.test(t))
        )
        break
      case 'updates':
        result = result.filter(n =>
          n.tags && n.tags.some((t: string) => /обновлен|update|релиз|release|новое/i.test(t))
        )
        break
    }

    return result
  }, [news, searchQuery, activeFilter, readIds])

  const unreadCount = useMemo(() => news.filter(n => !readIds.has(n.id)).length, [news, readIds])

  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text">Новости компании</h1>
          <p className="text-mute text-sm mt-1">Последние обновления, анонсы и важные события.</p>
        </div>

        {canCreateNews && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={16} /> Написать новость
          </Button>
        )}
      </div>

      {/* Search + Filters bar */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по новостям..."
            className="field w-full pl-11 pr-10 py-3 text-sm bg-card border border-line rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-mute hover:text-text transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key
            const count = f.key === 'unread' ? unreadCount : undefined
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-bold
                  border transition-all duration-200 select-none
                  ${isActive
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-card text-slate-600 border-line hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
                  }
                `}
              >
                <span>{f.emoji}</span>
                <span>{f.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none
                    ${isActive ? 'bg-white/25 text-white' : 'bg-blue-500/10 text-blue-600'}
                  `}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-line rounded-3xl">
          <div className="text-4xl mb-4">{searchQuery || activeFilter !== 'all' ? '🔍' : '📰'}</div>
          <h3 className="text-lg font-bold text-text mb-2">
            {searchQuery || activeFilter !== 'all' ? 'Ничего не найдено' : 'Новостей пока нет'}
          </h3>
          <p className="text-mute text-sm max-w-sm mx-auto">
            {searchQuery || activeFilter !== 'all'
              ? 'Попробуйте изменить запрос или сбросить фильтры.'
              : 'Здесь будут публиковаться важные новости и обновления компании.'}
          </p>
          {(searchQuery || activeFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('all') }}
              className="mt-4 text-sm text-blue-500 hover:text-blue-600 font-semibold transition-colors"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filtered.map(n => (
            <NewsCard key={n.id} news={n} isRead={readIds.has(n.id)} />
          ))}
        </div>
      )}

      <CreateNewsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchNews}
      />
    </div>
  )
}
