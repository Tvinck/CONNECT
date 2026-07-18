/**
 * POST /api/invite
 *
 * Creates a new employee account. Only users with the 'ceo' role may call this.
 *
 * Flow:
 *  1. Verify the caller is a logged-in CEO.
 *  2. Validate and sanitise the request body.
 *  3. Create an auth user via the Supabase Admin API (service_role — bypasses RLS).
 *  4. Upsert the public `users` profile row with the supplied metadata.
 *  5. On profile error, roll back the auth user to prevent orphaned accounts.
 *
 * Returns: { ok: true, id: string }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

/** Whitelist of roles that can be assigned when inviting. */
const VALID_ROLES: UserRole[] = ['ceo', 'design', 'dev', 'sales', 'support', 'coowner']

/** RFC-5322 subset — requires local@domain.tld with a 2+ char TLD. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

export async function POST(req: Request) {
  // 1. Authorize: only a logged-in CEO may invite.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'ceo') {
    return NextResponse.json({ error: 'Только CEO может приглашать сотрудников' }, { status: 403 })
  }

  // 2. Validate input.
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })

  const fullName  = String(body.fullName ?? '').trim()
  const email     = String(body.email ?? '').trim().toLowerCase()
  const password  = String(body.password ?? '')
  const position  = String(body.position ?? '').trim()
  const mention_tag = body.mention_tag ? String(body.mention_tag).trim() : null
  const skills    = Array.isArray(body.skills) ? body.skills : []
  const role      = (VALID_ROLES.includes(body.role) ? body.role : 'dev') as UserRole
  const projectIds = Array.isArray(body.projects) ? body.projects : []

  if (!fullName)              return NextResponse.json({ error: 'Укажите имя и фамилию' }, { status: 400 })
  if (!EMAIL_RE.test(email))  return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
  if (password.length < 6)    return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 })

  // 3. Create the auth user via the admin API (service_role).
  const admin = createAdminClient()
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (authErr || !created.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Не удалось создать пользователя' }, { status: 400 })
  }

  // 4. Upsert the profile row
  const { error: profErr } = await admin.from('users').upsert({
    id:          created.user.id,
    email,
    full_name:   fullName,
    position:    position || null,
    mention_tag: mention_tag,
    skills:      skills,
    role,
    is_active:   true,
    status:      'offline',
  })
  
  if (profErr) {
    // Roll back the auth user so we don't leave an orphan.
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: profErr.message }, { status: 400 })
  }

  // 5. Grant project access if provided
  if (projectIds.length > 0) {
    const memberRows = projectIds.map((pid: string) => ({
      project_id: pid,
      user_id: created.user.id,
      role: 'member'
    }))
    await admin.from('project_members').insert(memberRows)
  }

  return NextResponse.json({ ok: true, id: created.user.id })
}
