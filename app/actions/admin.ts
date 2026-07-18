'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function updateUser(userId: string, data: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Check if current user is ceo or art.koshelev
  const { data: me } = await supabase.from('users').select('email, role').eq('id', user.id).single()
  const isArt = me?.email?.includes('art.koshelev') || me?.role === 'ceo'
  if (!isArt) return { error: 'Нет прав' }

  const admin = createAdminClient()

  // Update users table
  const { error: updateErr } = await admin
    .from('users')
    .update({
      full_name: data.full_name,
      mention_tag: data.mention_tag,
      role: data.role,
      position: data.position,
      skills: data.skills || []
    })
    .eq('id', userId)

  if (updateErr) return { error: updateErr.message }

  // Update project_members if provided
  if (Array.isArray(data.projectIds)) {
    // 1. Delete existing memberships
    await admin.from('project_members').delete().eq('user_id', userId)

    // 2. Insert new ones
    if (data.projectIds.length > 0) {
      const rows = data.projectIds.map((pid: string) => ({
        project_id: pid,
        user_id: userId,
        role: 'member'
      }))
      await admin.from('project_members').insert(rows)
    }
  }

  return { ok: true }
}
