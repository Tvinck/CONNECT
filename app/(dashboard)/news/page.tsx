import { NewsFeed } from '@/components/news/NewsFeed'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Новости | Bazzar Connect',
  description: 'Внутренние новости компании',
}

export default function NewsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <NewsFeed />
    </div>
  )
}
