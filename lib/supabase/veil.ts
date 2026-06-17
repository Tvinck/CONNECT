import { createClient } from '@supabase/supabase-js'

/**
 * Инициализирует и возвращает клиент Supabase для взаимодействия с проектом Veil VPN.
 * Использует публичный URL и анонимный ключ доступа из переменных окружения.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient} Экземпляр клиента Supabase
 */
export function createVeilClient() {
  const url = process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY || 'placeholder'
  
  return createClient(url, key)
}
