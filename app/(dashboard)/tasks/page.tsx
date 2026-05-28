import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

const COLUMNS = [
  { key: 'todo',        label: 'Сделать',   color: '#8B92B4', count: 3 },
  { key: 'in_progress', label: 'В работе',  color: '#1472F5', count: 2 },
  { key: 'review',      label: 'Проверка',  color: '#F59E0B', count: 1 },
  { key: 'done',        label: 'Готово',    color: '#22C55E', count: 2 },
]

export default function TasksPage() {
  return (
    <>
      <Header
        title="Задачи"
        subtitle="Канбан-доска команды · 8 задач в работе"
      />

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Filters placeholder */}
          <button className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-line bg-white/[0.02] hover:bg-white/[0.04] text-[13px] text-mute hover:text-white transition-all">
            Все проекты
          </button>
          <button className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-line bg-white/[0.02] hover:bg-white/[0.04] text-[13px] text-mute hover:text-white transition-all">
            Любой приоритет
          </button>
        </div>
        <Button>
          <Plus size={16} /> Новая задача
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {COLUMNS.map((col) => (
          <div key={col.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-[13px] font-semibold tracking-tight">{col.label}</span>
              </div>
              <span className="text-[11px] text-mute2 font-mono bg-white/[0.04] px-2 h-5 rounded-md inline-flex items-center">
                {col.count}
              </span>
            </div>
            <div className="h-1 w-full rounded-full" style={{ background: `${col.color}40` }}>
              <div className="h-full rounded-full" style={{ background: col.color, width: '100%' }} />
            </div>
            <div className="text-center py-10 text-mute text-[13px]">
              Задачи появятся здесь
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
