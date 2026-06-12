'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'

export function NewsReadTracker({ newsId }: { newsId: string }) {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const markAsRead = async () => {
      const supabase = createClient()
      
      // Attempt to insert read record
      // We use upsert or just insert and ignore conflicts (since RLS limits what can be done and we have a unique composite key)
      const { error } = await supabase
        .from('news_reads')
        .insert({ news_id: newsId, user_id: user.id })
      
      // Ignore unique constraint violations (code 23505) because it means the user already read it
      if (error && error.code !== '23505') {
        console.error('Failed to mark news as read:', error)
      }
    }

    markAsRead()
  }, [newsId, user])

  return null
}
