'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'

/**
 * Tracks user online presence.
 * Mounts in layout.tsx. Every 1 minute while active, it pings the server to update `last_seen` and `status = 'online'`.
 * When the window is hidden or unmounted, it attempts to set `status = 'offline'`.
 */
export function PresenceTracker() {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    // Функция обновления статуса
    const updatePresence = async (status: 'online' | 'offline') => {
      try {
        await supabase
          .from('users')
          .update({ 
            status,
            last_seen: new Date().toISOString() 
          })
          .eq('id', user.id)
      } catch (err) {
        console.error('Failed to update presence', err)
      }
    }

    // Сразу ставим онлайн при монтировании
    updatePresence('online')

    // Периодический пинг каждую 1 минуту
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updatePresence('online')
      }
    }, 60 * 1000)

    // Обработка скрытия вкладки / ухода со страницы
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Пытаемся поставить офлайн через navigator.sendBeacon, если доступен (Supabase RPC предпочтительнее, 
        // но обычный update через REST тоже работает, хотя может быть отменен браузером).
        // Простой update:
        updatePresence('offline')
      } else if (document.visibilityState === 'visible') {
        updatePresence('online')
      }
    }

    const handleBeforeUnload = () => {
      updatePresence('offline')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      updatePresence('offline')
    }
  }, [user])

  return null
}
