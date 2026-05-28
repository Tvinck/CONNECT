import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { Plus } from 'lucide-react'

const CLIENTS = [
  { name: 'Анна Сергеева',    initials: 'АС', color: '#FF4D9D', source: 'ПодариМомент', status: 'vip',     spent: 18900, manager: 'СК', last: '2 дня'   },
  { name: 'Олег Машков',      initials: 'ОМ', color: '#1472F5', source: 'WB',           status: 'active',  spent: 4500,  manager: 'СК', last: 'сегодня' },
  { name: 'Полина Лях',       initials: 'ПЛ', color: '#22C55E', source: 'Ozon',         status: 'lead',    spent: 0,     manager: 'МЛ', last: '1 ч'      },
  { name: 'Карина Велли',     initials: 'КВ', color: '#FFC833', source: 'WB',           status: 'vip',     spent: 32400, manager: 'АК', last: '4 ч'      },
  { name: 'Денис Лавров',     initials: 'ДЛ', color: '#00C2FF', source: 'ПодариМомент', status: 'lead',    spent: 0,     manager: 'СК', last: '30 мин'   },
  { name: 'Юлия Бек',         initials: 'ЮБ', color: '#EF4444', source: 'Ozon',         status: 'churned', spent: 800,   manager: 'МЛ', last: '2 нед'    },
]

const STATUS_TONE: Record<string, 'gold' | 'ok' | 'accent' | 'mute'> = {
  vip:     'gold',
  active:  'ok',
  lead:    'accent',
  churned: 'mute',
}
const STATUS_LABEL: Record<string, string> = {
  vip: 'VIP', active: 'Активный', lead: 'Лид', churned: 'Ушёл',
}

const FUNNEL = [
  { label: 'Лиды',     n: 45, color: '#1472F5' },
  { label: 'Активные', n: 23, color: '#22C55E' },
  { label: 'VIP',      n: 8,  color: '#FFC833' },
]

export default function CrmPage() {
  return (
    <>
      <Header title="CRM" subtitle="Клиентская база и воронка продаж" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {FUNNEL.map((f) => (
          <div key={f.label} className="card p-5 text-center">
            <div className="text-[32px] font-bold tabular-nums" style={{ color: f.color }}>{f.n}</div>
            <div className="text-[12.5px] text-mute mt-1">{f.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-semibold tracking-tight">Все клиенты</h3>
        <Button><Plus size={16} /> Добавить клиента</Button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-mute2">
              <th className="text-left px-5 py-3 font-semibold">Клиент</th>
              <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Источник</th>
              <th className="text-left px-5 py-3 font-semibold">Статус</th>
              <th className="text-right px-5 py-3 font-semibold hidden lg:table-cell">Оборот</th>
              <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Менеджер</th>
              <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Последний контакт</th>
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c, i) => (
              <tr key={i} className="border-b border-line last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar initials={c.initials} color={c.color} size={32} />
                    <span className="text-[13.5px] font-medium tracking-tight">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[12.5px] text-mute hidden md:table-cell">{c.source}</td>
                <td className="px-5 py-3.5">
                  <Tag tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Tag>
                </td>
                <td className="px-5 py-3.5 text-right text-[13px] font-mono hidden lg:table-cell">
                  {c.spent > 0 ? `${c.spent.toLocaleString('ru-RU')} ₽` : '—'}
                </td>
                <td className="px-5 py-3.5 text-[12.5px] text-mute hidden lg:table-cell">{c.manager}</td>
                <td className="px-5 py-3.5 text-right text-[12px] text-mute2 font-mono hidden md:table-cell">{c.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
