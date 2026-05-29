import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Progress } from '@/components/ui/Progress'
import { PageContainer } from '@/components/layout/PageContainer'
import { ProfileClient } from '@/components/profile/ProfileClient'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { levelInfo } from '@/lib/utils'

export default async function ProfilePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()

  const [{ data: allAchs }, { data: earnedAchs }, { count: tasksDone }] = await Promise.all([
    supabase.from('achievements').select('id, key, title, icon, description, points').order('title'),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', profile.id),
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('assignee_id', profile.id).eq('status', 'done'),
  ])

  type EarnedRow = { achievement_id: string }
  type AchRow = { id: string; key: string; title: string; icon: string; description: string; points: number }

  const earnedIds = new Set((earnedAchs ?? []).map((r: EarnedRow) => r.achievement_id))
  const achievements = (allAchs ?? []).map((a: AchRow) => ({ ...a, earned: earnedIds.has(a.id) }))

  const daysIn = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
  const lvl    = levelInfo(profile.points)

  return (
    <PageContainer>
      <Header title="Профиль" subtitle="Твои достижения и баллы" />
      <ProfileClient
        profile={profile}
        achievements={achievements}
        tasksDone={tasksDone ?? 0}
        daysIn={daysIn}
        levelData={lvl}
      />
    </PageContainer>
  )
}
