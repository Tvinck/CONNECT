import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Search, Plus, Clock, Eye } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'

const CATEGORIES = [
  { id: 'onboarding', label: 'Онбординг',    emoji: '🚀', color: '#1472F5', count: 8  },
  { id: 'processes',  label: 'Процессы',     emoji: '⚙️', color: '#6F4FE8', count: 14 },
  { id: 'tools',      label: 'Инструменты',  emoji: '🛠', color: '#00C2FF', count: 11 },
  { id: 'faq',        label: 'FAQ',          emoji: '❓', color: '#FFC833', count: 6  },
]

const ARTICLES = [
  { id: 'a1', title: 'Как обработать заказ в ПодариМомент', author: 'АК', authorColor: '#1472F5', read: '5 мин', views: 142, fresh: true },
  { id: 'a2', title: 'Настройка Suno API — без боли',        author: 'ИП', authorColor: '#1472F5', read: '8 мин', views: 87 },
  { id: 'a3', title: 'Скрипты для общения с клиентом',       author: 'СК', authorColor: '#F59E0B', read: '6 мин', views: 211 },
  { id: 'a4', title: 'Что делать, если оплата не прошла',    author: 'МЛ', authorColor: '#FF4D9D', read: '4 мин', views: 64 },
  { id: 'a5', title: 'Гайд по дизайн-системе',               author: 'МЛ', authorColor: '#FF4D9D', read: '12 мин', views: 198 },
  { id: 'a6', title: 'Как ставить задачи в CONNECT',         author: 'АК', authorColor: '#1472F5', read: '5 мин', views: 322, fresh: true },
]

export default function KnowledgePage() {
  return (
    <PageContainer>
      <Header title="База знаний" subtitle="Процессы, инструменты и FAQ команды" />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
          <input
            placeholder="Поиск по статьям…"
            className="w-full h-10 pl-10 pr-3 bg-white/[0.025] border border-line rounded-xl text-[13px] placeholder:text-mute2 focus:border-accent focus:bg-white/[0.04] outline-none transition-all"
          />
        </div>
        <Button><Plus size={16} /> Новая статья</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className="card card-tight p-4 text-left cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="text-2xl mb-2">{cat.emoji}</div>
            <div className="text-[13.5px] font-semibold tracking-tight">{cat.label}</div>
            <div className="text-[11px] text-mute mt-1">{cat.count} статей</div>
          </button>
        ))}
      </div>

      <h3 className="text-[17px] font-semibold tracking-tight mb-4">Все статьи</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ARTICLES.map((a) => (
          <div key={a.id} className="card p-5 cursor-pointer lift">
            {a.fresh && (
              <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-semibold mb-3">
                Новое
              </span>
            )}
            <h4 className="text-[14px] font-semibold tracking-tight leading-snug">{a.title}</h4>
            <div className="flex items-center gap-3 mt-3 text-[11.5px] text-mute">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: a.authorColor }}>{a.author}</span>
              </div>
              <span className="inline-flex items-center gap-1"><Clock size={11}/> {a.read}</span>
              <span className="inline-flex items-center gap-1"><Eye size={11}/> {a.views}</span>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
