'use client'

import { useState } from 'react'
import { Pencil, Zap } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { EditProfileModal } from './EditProfileModal'
import { colorFor } from '@/lib/utils'
import type { User } from '@/types'

interface AchRow { id: string; key: string; title: string; icon: string; description: string; points: number; earned: boolean }
interface LevelData { current: { name: string; min: number }; next: { name: string; min: number } | null; progress: number; remaining: number }

interface Props {
  profile: User
  achievements: AchRow[]
  tasksDone: number
  daysIn: number
  levelData: LevelData
}

export function ProfileClient({ profile, achievements, tasksDone, daysIn, levelData }: Props) {
  const [user, setUser]       = useState<User>(profile)
  const [showEdit, setShowEdit] = useState(false)

  const initials = user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const color    = colorFor(user.full_name)

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left — user card */}
        <div className="xl:col-span-1 space-y-5">
          <div className="card p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar initials={initials} color={color} size={80} status={user.status} />
                <button
                  onClick={() => setShowEdit(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand border-2 border-bg text-[#171821] inline-flex items-center justify-center hover:bg-brand/90 transition-all"
                >
                  <Pencil size={12} />
                </button>
              </div>
            </div>
            <h2 className="text-[20px] font-bold tracking-tight">{user.full_name}</h2>
            <p className="text-mute text-[13px] mt-1">
              {user.position ?? user.role.toUpperCase()} · BAZZAR Group
            </p>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-line">
              <div className="text-center">
                <div className="text-[22px] font-bold text-accent">{daysIn}</div>
                <div className="text-[10.5px] text-mute2 mt-0.5">дней</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-bold text-ok">{tasksDone}</div>
                <div className="text-[10.5px] text-mute2 mt-0.5">задач</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-bold text-gold">{user.points}</div>
                <div className="text-[10.5px] text-mute2 mt-0.5">баллов</div>
              </div>
            </div>

            <Button className="w-full mt-5" variant="ghost" onClick={() => setShowEdit(true)}>
              <Pencil size={14} /> Редактировать профиль
            </Button>
          </div>

          {/* Level card */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold inline-flex items-center justify-center">
                <Zap size={18} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-mute2 font-semibold">Уровень</div>
                <div className="text-[16px] font-bold">
                  {levelData.current.name} <span className="text-gold">⚡</span>
                </div>
              </div>
            </div>
            <Progress value={levelData.progress} color="#FFC833" height={6} />
            <div className="flex items-center justify-between mt-2 text-[11px] text-mute2 font-mono">
              <span>{user.points} баллов</span>
              {levelData.next
                ? <span>{levelData.remaining} до «{levelData.next.name}»</span>
                : <span>Максимальный уровень!</span>
              }
            </div>
          </div>
        </div>

        {/* Right — achievements */}
        <div className="xl:col-span-2 space-y-5">
          <div className="card p-6">
            <h3 className="text-[17px] font-semibold tracking-tight mb-4">Ачивки</h3>
            {achievements.length === 0 ? (
              <p className="text-mute text-[13px]">Достижения загружаются…</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {achievements.map(a => {
                  const rarity = a.points >= 25 ? 'legendary' : a.points >= 15 ? 'epic' : a.points >= 8 ? 'rare' : 'common'
                  const rarityStyle: Record<string, { border: string; glow: string; label: string; labelColor: string }> = {
                    legendary: { border: '#FFC833', glow: '0 0 20px -4px #FFC83366', label: 'Легендарное', labelColor: '#FFC833' },
                    epic:      { border: '#6F4FE8', glow: '0 0 20px -4px #6F4FE866', label: 'Эпическое',   labelColor: '#6F4FE8' },
                    rare:      { border: '#00C2FF', glow: '0 0 20px -4px #00C2FF55', label: 'Редкое',      labelColor: '#00C2FF' },
                    common:    { border: '#232A4F', glow: 'none',                    label: 'Обычное',     labelColor: '#5A6188' },
                  }
                  const rs = rarityStyle[rarity]
                  return (
                    <div key={a.id} title={`${a.description} (+${a.points} баллов)`}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                        a.earned ? 'hover:scale-[1.03]' : 'opacity-35 grayscale saturate-0'
                      }`}
                      style={a.earned ? {
                        borderColor: rs.border,
                        boxShadow: rs.glow,
                        background: `${rs.border}08`,
                      } : { borderColor: '#232A4F' }}
                    >
                      <div className="w-14 h-14 rounded-xl inline-flex items-center justify-center text-3xl"
                        style={a.earned ? { background: `${rs.border}15` } : {}}>
                        {a.icon ?? '🏅'}
                      </div>
                      <div className="text-center">
                        <div className="text-[12px] font-semibold leading-tight">{a.title}</div>
                        <div className="text-[10px] mt-0.5 font-medium" style={{ color: a.earned ? rs.labelColor : '#5A6188' }}>
                          {rs.label}
                        </div>
                        {a.earned && (
                          <div className="text-[10px] text-mute2 mt-0.5">+{a.points} баллов</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-[17px] font-semibold tracking-tight mb-4">Сводка</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-bg border border-line p-4">
                <div className="text-[12px] text-mute2 mb-1">Роль</div>
                <div className="text-[15px] font-semibold capitalize">{user.role}</div>
              </div>
              <div className="rounded-xl bg-bg border border-line p-4">
                <div className="text-[12px] text-mute2 mb-1">Статус</div>
                <div className="flex items-center gap-2 text-[15px] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full"
                    style={{ background: user.status === 'online' ? '#22C55E' : user.status === 'busy' ? '#F59E0B' : '#5A6188' }}
                  />
                  {user.status === 'online' ? 'Онлайн' : user.status === 'busy' ? 'Занят' : 'Офлайн'}
                </div>
              </div>
              <div className="rounded-xl bg-bg border border-line p-4">
                <div className="text-[12px] text-mute2 mb-1">Email</div>
                <div className="text-[13px] font-medium truncate">{user.email}</div>
              </div>
              <div className="rounded-xl bg-bg border border-line p-4">
                <div className="text-[12px] text-mute2 mb-1">Должность</div>
                <div className="text-[15px] font-semibold">{user.position ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <EditProfileModal
          profile={user}
          onClose={() => setShowEdit(false)}
          onSaved={updated => setUser(updated)}
        />
      )}
    </>
  )
}
