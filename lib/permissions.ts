import { redirect } from 'next/navigation'
import { getCurrentProfile } from './auth'
import { createClient } from './supabase/server'
import type { User } from '@/types'

/**
 * Mappings between local system role IDs and database display/matrix roles.
 */
const ROLE_MAP: Record<string, string> = {
  dev: 'Разработка',
  design: 'Дизайн',
  sales: 'Продажи',
  support: 'Чат/SEO',
}

/**
 * Fetches the permission matrix levels for a specific role.
 * Automatically gives CEO and Co-owner full access (2) to all known sections.
 */
export async function getUserPermissions(role: string): Promise<Record<string, number>> {
  if (role === 'ceo' || role === 'coowner') {
    return {
      'Дашборд': 2,
      'Задачи': 2,
      'Проекты': 2,
      'База знаний': 2,
      'Идеи': 2,
      'CRM': 2,
      'Заказы': 2,
      'Финансы': 2,
      'Чаты': 2,
      'Сервисы': 2,
    }
  }

  const mappedRole = ROLE_MAP[role]
  if (!mappedRole) {
    return {}
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('role_permissions')
    .select('section, level')
    .eq('role', mappedRole)

  const perms: Record<string, number> = {}
  if (data) {
    for (const item of data) {
      perms[item.section] = item.level
    }
  }

  return perms
}

/**
 * Enforces section permission checks on server components (pages).
 * Redirects unauthorized requests back to the dashboard with an error flag.
 */
export async function verifyPagePermission(section: string, minLevel: number = 1): Promise<User> {
  const profile = await getCurrentProfile()
  if (!profile) {
    redirect('/login')
  }

  if (profile.role === 'ceo' || profile.role === 'coowner') {
    return profile
  }

  const mappedRole = ROLE_MAP[profile.role]
  if (!mappedRole) {
    redirect('/dashboard?error=access_denied')
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('role_permissions')
    .select('level')
    .eq('role', mappedRole)
    .eq('section', section)
    .maybeSingle()

  const level = data?.level ?? 0
  if (level < minLevel) {
    redirect('/dashboard?error=access_denied')
  }

  return profile
}
