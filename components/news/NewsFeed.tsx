'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NewsCard } from './NewsCard'
import { CreateNewsModal } from './CreateNewsModal'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/store/auth'
import { Plus, Search, X } from 'lucide-react'

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
      {/* Shared top bar (title + global search / notifications / profile) */}
      <Header
        title="Новости компании"
        subtitle="Последние обновления, анонсы и важные события."
      />

      {canCreateNews && (
        <div className="flex justify-end -mt-2 mb-6">
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={16} /> Написать новость
          </Button>
        </div>
      )}

      {/* Search + Filters bar */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по новостям..."
            className="field w-full pl-11 pr-10 py-3 text-sm bg-card border border-line rounded-2xl shadow-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
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
                    ? 'bg-brand text-[#171821] border-brand shadow-md shadow-brand/20'
                    : 'bg-card text-slate-600 border-line hover:border-line2 hover:text-slate-800 hover:bg-black/[0.02]'
                  }
                `}
              >
                <span>{f.emoji}</span>
                <span>{f.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none
                    ${isActive ? 'bg-black/10 text-[#171821]' : 'bg-accent/10 text-accent'}
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
        <div className="grid grid-cols-1 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-line rounded-card p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="bg-card border border-line rounded-card"
          emoji={searchQuery || activeFilter !== 'all' ? '🔍' : '📰'}
          title={searchQuery || activeFilter !== 'all' ? 'Ничего не найдено' : 'Новостей пока нет'}
          description={searchQuery || activeFilter !== 'all'
            ? 'Попробуйте изменить запрос или сбросить фильтры.'
            : 'Здесь будут публиковаться важные новости и обновления компании.'}
          action={(searchQuery || activeFilter !== 'all') ? (
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('all') }}
              className="text-sm text-accent hover:text-accent/80 font-semibold transition-colors"
            >
              Сбросить фильтры
            </button>
          ) : undefined}
        />
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
