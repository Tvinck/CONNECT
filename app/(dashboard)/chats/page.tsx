import { Avatar } from '@/components/ui/Avatar'
import { Hash, Send, Plus } from 'lucide-react'

const CHANNELS = [
  { id: 'general', label: 'общий',      unread: 2, active: true  },
  { id: 'dev',     label: 'разработка', unread: 0  },
  { id: 'sales',   label: 'продажи',    unread: 0  },
  { id: 'design',  label: 'дизайн',     unread: 0  },
  { id: 'support', label: 'поддержка',  unread: 1  },
]

const MESSAGES = [
  { who: 'Артём', initials: 'АК', color: '#1472F5', time: '14:02', text: 'Глянь новый макет карточки заказа — обновил состояния hover и пустое.' },
  { who: 'Маша',  initials: 'МЛ', color: '#FF4D9D', time: '14:05', text: 'Огонь 🔥 только отступы на нижнем блоке поправь — 24 везде, у тебя 16. И давай кнопку «Оплатить» чуть поярче, тонет в фоне.' },
  { who: 'Артём', initials: 'АК', color: '#1472F5', time: '14:08', text: 'Принял, сейчас поправлю и закину обновлённую версию.' },
  { who: 'Дима',  initials: 'ДО', color: '#22C55E', time: '14:14', text: 'Я тогда подожду с версткой до финала — чтобы дважды не переделывать.' },
  { who: 'Маша',  initials: 'МЛ', color: '#FF4D9D', time: '14:16', text: 'Договорились. Постараюсь закрыть к концу дня 🌚' },
]

const MEMBERS = [
  { name: 'Артём Кошелев', initials: 'АК', color: '#1472F5', role: 'CEO',        online: true  },
  { name: 'Маша Лебедева', initials: 'МЛ', color: '#FF4D9D', role: 'Дизайнер',   online: true  },
  { name: 'Дима Орлов',    initials: 'ДО', color: '#22C55E', role: 'Разработка', online: true  },
  { name: 'Соня Кирилова', initials: 'СК', color: '#F59E0B', role: 'Продажи',    online: false },
]

export default function ChatsPage() {
  return (
    <div className="flex" style={{ height: '100vh' }}>
      {/* Channels list */}
      <div className="w-[220px] shrink-0 border-r border-line flex flex-col">
        <div className="px-4 py-4 border-b border-line">
          <h3 className="text-[13px] font-bold tracking-tight">Чаты</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-mute2 px-2 mb-1.5 font-semibold mt-2">
            Каналы
          </div>
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              className={`w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[13px] font-medium tracking-tight mb-0.5 transition-all
                ${c.active
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-mute hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <Hash size={14} className="shrink-0" />
              <span className="flex-1 text-left truncate">{c.label}</span>
              {c.unread ? (
                <span className="min-w-[18px] h-4 px-1 rounded bg-accent text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                  {c.unread}
                </span>
              ) : null}
            </button>
          ))}
          <button className="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[12px] text-mute hover:text-white hover:bg-white/[0.04] mt-1 transition-all">
            <Plus size={14} /> Создать канал
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="px-5 py-3.5 border-b border-line flex items-center gap-3 shrink-0">
          <Hash size={16} className="text-mute shrink-0" />
          <span className="text-[14px] font-semibold tracking-tight">общий</span>
          <span className="text-[12px] text-mute ml-1 hidden sm:block">· Всё подряд</span>
          <div className="ml-auto flex items-center gap-1 text-[12px] text-mute2">
            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-dot" />
            <span>{MEMBERS.filter((m) => m.online).length} онлайн</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {MESSAGES.map((m, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <Avatar initials={m.initials} color={m.color} size={34} className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2.5 mb-1">
                  <span className="text-[13.5px] font-semibold">{m.who}</span>
                  <span className="text-[11px] text-mute2 font-mono">{m.time}</span>
                </div>
                <div className="text-[13.5px] text-white/85 leading-relaxed">{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-line shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-line hover:border-line2 transition-all">
            <input
              placeholder="Написать в #общий…"
              className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-mute2"
            />
            <button className="w-8 h-8 rounded-lg bg-accent/15 text-accent hover:bg-accent hover:text-white transition-all inline-flex items-center justify-center shrink-0">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Members panel */}
      <div className="w-[200px] shrink-0 border-l border-line hidden xl:flex flex-col">
        <div className="px-4 py-4 border-b border-line shrink-0">
          <span className="text-[11px] text-mute uppercase tracking-[0.12em] font-semibold">
            Участники · {MEMBERS.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {MEMBERS.map((m, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              <div className="relative shrink-0">
                <Avatar initials={m.initials} color={m.color} size={28} />
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-sidebar"
                  style={{ background: m.online ? '#22C55E' : '#5A6188' }}
                />
              </div>
              <div className="text-left min-w-0">
                <div className="text-[12px] font-medium truncate">{m.name.split(' ')[0]}</div>
                <div className="text-[10.5px] text-mute2 truncate">{m.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
