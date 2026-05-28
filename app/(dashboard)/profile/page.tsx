import { Header } from '@/components/layout/Header'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Pencil, Zap } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'

const USER = {
  name: 'Артём Кошелев',
  role: 'CEO',
  org: 'BAZZAR Group',
  initials: 'АК',
  points: 340,
  nextLevel: 500,
  level: 'Специалист',
  daysInProject: 124,
  tasksClosed: 47,
  ordersHandled: 23,
}

const ACHIEVEMENTS = [
  { emoji: '🤝', name: 'Первая сделка',    earned: true  },
  { emoji: '🌟', name: 'Пятёрка',          earned: true  },
  { emoji: '🔟', name: 'Десятка',          earned: true  },
  { emoji: '👋', name: 'Добро пожаловать', earned: true  },
  { emoji: '🔥', name: '7 дней подряд',    earned: true  },
  { emoji: '📚', name: 'Знаток',           earned: false },
  { emoji: '💪', name: 'Двадцатка',        earned: false },
  { emoji: '👑', name: 'Сотня',            earned: false },
]

const POINT_HISTORY = [
  { delta: +20, reason: 'Досрочное закрытие задачи',  when: 'Сегодня'      },
  { delta: +10, reason: 'Закрытая задача',             when: 'Вчера'        },
  { delta: -50, reason: 'Покупка в магазине баллов',  when: '3 дня назад'  },
  { delta: +25, reason: 'Отзыв коллеги · Маша',       when: 'Неделю назад' },
]

export default function ProfilePage() {
  return (
    <PageContainer>
      <Header title="Профиль" subtitle="Твои достижения и баллы" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left — user card */}
        <div className="xl:col-span-1 space-y-5">
          <div className="card p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar initials={USER.initials} color="#1472F5" size={80} online />
                <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent border-2 border-bg text-white inline-flex items-center justify-center">
                  <Pencil size={12} />
                </button>
              </div>
            </div>
            <h2 className="text-[20px] font-bold tracking-tight">{USER.name}</h2>
            <p className="text-mute text-[13px] mt-1">{USER.role} · {USER.org}</p>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-line">
              <div className="text-center">
                <div className="text-[22px] font-bold text-accent">{USER.daysInProject}</div>
                <div className="text-[10.5px] text-mute2 mt-0.5">дней</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-bold text-ok">{USER.tasksClosed}</div>
                <div className="text-[10.5px] text-mute2 mt-0.5">задач</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-bold text-gold">{USER.points}</div>
                <div className="text-[10.5px] text-mute2 mt-0.5">баллов</div>
              </div>
            </div>

            <Button className="w-full mt-5" variant="ghost">
              <Pencil size={14} /> Редактировать профиль
            </Button>
          </div>

          {/* Level */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold inline-flex items-center justify-center">
                <Zap size={18} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-mute2 font-semibold">Уровень</div>
                <div className="text-[16px] font-bold">{USER.level} <span className="text-gold">⚡</span></div>
              </div>
            </div>
            <Progress value={(USER.points / USER.nextLevel) * 100} color="#FFC833" height={6} />
            <div className="flex items-center justify-between mt-2 text-[11px] text-mute2 font-mono">
              <span>{USER.points} баллов</span>
              <span>{USER.nextLevel - USER.points} до «Старший»</span>
            </div>
          </div>
        </div>

        {/* Right — achievements + history */}
        <div className="xl:col-span-2 space-y-5">
          <div className="card p-6">
            <h3 className="text-[17px] font-semibold tracking-tight mb-4">Ачивки</h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {ACHIEVEMENTS.map((a, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer ${!a.earned ? 'ach-locked' : ''}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-line inline-flex items-center justify-center text-2xl hover:border-line2 transition-all">
                    {a.emoji}
                  </div>
                  <span className="text-[10px] text-mute2 text-center leading-tight">{a.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-[17px] font-semibold tracking-tight mb-4">История баллов</h3>
            <div className="space-y-3">
              {POINT_HISTORY.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-line last:border-0">
                  <div>
                    <div className="text-[13.5px] font-medium tracking-tight">{p.reason}</div>
                    <div className="text-[11.5px] text-mute mt-0.5">{p.when}</div>
                  </div>
                  <span className={`text-[15px] font-bold tabular-nums ${p.delta > 0 ? 'text-ok' : 'text-err'}`}>
                    {p.delta > 0 ? '+' : ''}{p.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
