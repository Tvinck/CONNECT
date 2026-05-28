import { Header } from '@/components/layout/Header'
import { Progress } from '@/components/ui/Progress'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

const PROJECTS = [
  { id: 'podari', name: 'ПодариМомент',  emoji: '🎁', color: '#1472F5', progress: 80, status: 'active',   statusLabel: 'Активный',      tasks: 12, team: 4 },
  { id: 'pixel',  name: 'PIXEL',         emoji: '✨', color: '#FF4D9D', progress: 35, status: 'dev',      statusLabel: 'В разработке',  tasks: 8,  team: 3 },
  { id: 'bazzar', name: 'BAZZAR MARKET', emoji: '🛒', color: '#22C55E', progress: 12, status: 'planning', statusLabel: 'Планирование',  tasks: 5,  team: 2 },
]

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'mute'> = {
  active:   'ok',
  dev:      'warn',
  planning: 'mute',
}

export default function ProjectsPage() {
  return (
    <>
      <Header title="Проекты" subtitle="3 активных проекта · BAZZAR Group" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-mute text-sm">Все проекты команды</p>
        <Button><Plus size={16} /> Новый проект</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {PROJECTS.map((p) => (
          <div key={p.id} className="card p-6 cursor-pointer lift">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-2xl inline-flex items-center justify-center text-2xl"
                style={{ background: `${p.color}22` }}
              >
                {p.emoji}
              </div>
              <Tag tone={STATUS_TONE[p.status]}>{p.statusLabel}</Tag>
            </div>
            <h3 className="text-[17px] font-bold tracking-tight">{p.name}</h3>
            <p className="text-[12.5px] text-mute mt-1">{p.tasks} задач · {p.team} участника</p>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-mute">Готовность</span>
                <span className="text-[13px] font-bold" style={{ color: p.color }}>{p.progress}%</span>
              </div>
              <Progress value={p.progress} color={p.color} height={6} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
