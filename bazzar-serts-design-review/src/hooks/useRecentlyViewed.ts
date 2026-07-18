import { useState, useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════
   useRecentlyViewed — Хранит недавно просмотренные товары
   в localStorage. Максимум 8 товаров.
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'bazzar_recently_viewed'
const MAX_ITEMS = 8

export function useRecentlyViewed() {
  const [viewed, setViewed] = useState<string[]>([])

  // Загрузить из localStorage при маунте
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setViewed(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // Добавить товар
  const addViewed = (productId: string) => {
    setViewed(prev => {
      const filtered = prev.filter(id => id !== productId)
      const updated = [productId, ...filtered].slice(0, MAX_ITEMS)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }

  return { viewed, addViewed }
}
