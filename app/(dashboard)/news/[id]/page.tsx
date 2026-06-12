import { createClient } from '@/lib/supabase/server'
// @ts-ignore
// (Removed unused cookies import)
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { getInitials, colorFor } from '@/lib/utils'
import { FormattedText } from '@/components/ui/FormattedText'
import { NewsComments } from '@/components/news/NewsComments'
import { NewsReadTracker } from '@/components/news/NewsReadTracker'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Новость | Bazzar Connect',
  description: 'Просмотр новости компании',
}

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: news } = await supabase
    .from('news')
    .select(`
      id, title, content, tags, created_at,
      author:users!author_id(full_name, avatar_url)
    `)
    .eq('id', params.id)
    .single()

  if (!news) return notFound()

  // Type assertion to bypass Supabase's generated array type
  const author: any = news.author

  return (
    <div className="flex-1 overflow-y-auto">
      <NewsReadTracker newsId={news.id} />
      <div className="max-w-4xl mx-auto w-full py-8 px-4">
        
        <Link href="/news" className="inline-flex items-center gap-2 text-sm text-mute hover:text-blue-500 font-medium transition-colors mb-6">
          <ArrowLeft size={16} /> Назад к новостям
        </Link>
        
        <div className="bg-card border border-line rounded-[2rem] p-8 shadow-sm">
          {news.tags && news.tags.length > 0 && (
            <div className="flex gap-2 mb-4">
              {news.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-bold tracking-wide uppercase">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text leading-tight mb-6">
            {news.title}
          </h1>

          <div className="flex items-center gap-3 pb-8 border-b border-line mb-8">
            <Avatar initials={getInitials(author?.full_name)} color={colorFor(author?.full_name || '')} size={48} />
            <div>
              <h3 className="text-base font-bold text-text leading-tight">{author?.full_name}</h3>
              <span className="text-[13px] text-mute">{new Date(news.created_at).toLocaleDateString()} в {new Date(news.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          <div className="text-base text-slate-700 leading-relaxed max-w-3xl">
            <FormattedText text={news.content} />
          </div>
        </div>

        <NewsComments newsId={news.id} />
      </div>
    </div>
  )
}
