'use client'

import Link from 'next/link'
import { FormattedText } from '@/components/ui/FormattedText'
import { Avatar } from '@/components/ui/Avatar'
import { getInitials, colorFor } from '@/lib/utils'

export function NewsCard({ news, isRead = true }: { news: any, isRead?: boolean }) {
  // Truncate content for the card view
  const previewText = news.content.length > 200 
    ? news.content.substring(0, 200) + '...' 
    : news.content

  return (
    <Link href={`/news/${news.id}`} className={`block border bg-card rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-lg transition-all duration-200 relative ${isRead ? 'border-line' : 'border-blue-500/50 shadow-md shadow-blue-500/5'}`}>
      {!isRead && (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-bg shadow-sm" />
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar initials={getInitials(news.author?.full_name)} color={colorFor(news.author?.full_name || '')} size={36} />
          <div>
            <h3 className="text-[14px] font-bold text-text leading-tight">{news.author?.full_name}</h3>
            <span className="text-[11px] text-mute">{new Date(news.created_at).toLocaleDateString()} {new Date(news.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>
        {news.tags && news.tags.length > 0 && (
          <div className="flex gap-2">
            {news.tags.map((tag: string) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold tracking-wide uppercase">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <h2 className="text-lg font-black tracking-tight text-text mb-2">{news.title}</h2>
      
      <div className="text-[13.5px] text-slate-600">
        <FormattedText text={previewText} />
      </div>
      
      <div className="mt-4 pt-4 border-t border-line text-[12px] text-blue-500 font-semibold flex justify-end">
        Читать полностью &rarr;
      </div>
    </Link>
  )
}
