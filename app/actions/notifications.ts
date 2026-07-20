'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Действия над уведомлениями через admin-клиент (обходит любые пробелы RLS),
// но пользователь определяется на сервере из сессии — чистить/читать можно
// ТОЛЬКО свои уведомления.

export async function clearMyNotifications() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin.from('notifications').delete().eq('user_id', user.id)
  if (error) {
    console.error('[clearMyNotifications]', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function markAllMyNotificationsRead() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  if (error) {
    console.error('[markAllMyNotificationsRead]', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}
