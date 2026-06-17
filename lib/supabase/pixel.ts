import { createClient } from '@supabase/supabase-js'

/**
 * Инициализирует и возвращает административный клиент Supabase для взаимодействия с проектом Pixel AI.
 * Использует сервисный ключ (Service Role Key) из переменных окружения для выполнения
 * операций в обход политик безопасности RLS (Row Level Security).
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient} Экземпляр клиента Supabase с административными правами
 */
export function createPixelClient() {
  const url = process.env.PIXEL_SUPABASE_URL || 'https://ktookvpqtmzfccojarwm.supabase.co'
  const key = process.env.PIXEL_SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!key) {
    console.warn('⚠️ PIXEL_SUPABASE_SERVICE_ROLE_KEY is not defined in environment.')
  }
  
  return createClient(url, key, {
    auth: { persistSession: false }
  })
}
