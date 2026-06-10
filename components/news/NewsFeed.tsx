'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NewsCard } from './NewsCard'
import { CreateNewsModal } from './CreateNewsModal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'
import { Plus, Loader2 } from 'lucide-react'

export function NewsFeed() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  useEffect(() => {
    fetchNews()
  }, [])

  const canCreateNews = user?.role === 'ceo' || user?.role === 'coowner'

  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-4">
      <div className="flex items-center justify-between mb-8">
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

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-20 bg-card border border-line rounded-3xl">
          <div className="text-4xl mb-4">📰</div>
          <h3 className="text-lg font-bold text-text mb-2">Новостей пока нет</h3>
          <p className="text-mute text-sm max-w-sm mx-auto">Здесь будут публиковаться важные новости и обновления компании.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {news.map(n => (
            <NewsCard key={n.id} news={n} />
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
