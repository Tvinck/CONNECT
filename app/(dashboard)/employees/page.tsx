import { Header } from '@/components/layout/Header'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { MessageSquare } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'

const EMPLOYEES = [
  { id: 'e1', name: 'Артём Кошелев', initials: 'АК', color: '#1472F5', title: 'CEO',         status: 'online',  level: 'Специалист', points: 340,  closed: 47  },
  { id: 'e2', name: 'Маша Лебедева', initials: 'МЛ', color: '#FF4D9D', title: 'Дизайнер',    status: 'online',  level: 'Старший',    points: 612,  closed: 84  },
  { id: 'e3', name: 'Дима Орлов',    initials: 'ДО', color: '#22C55E', title: 'Fullstack',   status: 'busy',    level: 'Эксперт',    points: 1480, closed: 162 },
  { id: 'e4', name: 'Соня Кирилова', initials: 'СК', color: '#F59E0B', title: 'Продажи',     status: 'offline', level: 'Старший',    points: 540,  closed: 71  },
  { id: 'e5', name: 'Иван Петров',   initials: 'ИП', color: '#00C2FF', title: 'Frontend',    status: 'online',  level: 'Старший',    points: 720,  closed: 92  },
  { id: 'e6', name: 'Карина Тимош',  initials: 'КТ', color: '#6F4FE8', title: 'SEO · Чат',   status: 'online',  level: 'Специалист', points: 220,  closed: 28  },
]

const STATUS_COLOR: Record<string, string> = {
  online:  '#22C55E',
  busy:    '#F59E0B',
  offline: '#5A6188',
}
const STATUS_LABEL: Record<string, string> = {
  online:  'Онлайн',
  busy:    'На встрече',
  offline: 'Не в сети',
}

export default function EmployeesPage() {
  return (
    <PageContainer>
      <Header title="Сотрудники" subtitle={`${EMPLOYEES.length} человек в команде`} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {EMPLOYEES.map((e) => (
          <div key={e.id} className="card p-5 cursor-pointer lift">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar initials={e.initials} color={e.color} size={44} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-card"
                    style={{ background: STATUS_COLOR[e.status] }}
                  />
                </div>
                <div>
                  <div className="text-[14.5px] font-bold tracking-tight">{e.name}</div>
                  <div className="text-[12px] text-mute">{e.title}</div>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg border border-line bg-white/[0.02] hover:bg-accent/15 hover:text-accent hover:border-accent/30 text-mute inline-flex items-center justify-center transition-all">
                <MessageSquare size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line">
              <div className="text-center">
                <div className="text-[18px] font-bold tabular-nums" style={{ color: e.color }}>{e.points}</div>
                <div className="text-[10.5px] text-mute2 mt-0.5">баллов</div>
              </div>
              <div className="text-center">
                <div className="text-[18px] font-bold tabular-nums">{e.closed}</div>
                <div className="text-[10.5px] text-mute2 mt-0.5">задач</div>
              </div>
              <div className="text-right">
                <div className="text-[12.5px] font-semibold">{e.level}</div>
                <div className="text-[11px] text-mute mt-0.5">{STATUS_LABEL[e.status]}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
