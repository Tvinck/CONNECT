'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import { SupportTabs } from '../support/SupportTabs'

export function BazzarCertsPanel() {
  const supabase = createClient()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replying, setReplying] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<'open' | 'answered'>('open')

  useEffect(() => {
    loadTickets()
  }, [filter])

  const loadTickets = async () => {
    setLoading(true)
    let query = supabase.from('bazzar_tickets').select('*').order('created_at', { ascending: false })
    
    if (filter === 'open') {
      query = query.eq('status', 'open')
    } else {
      query = query.eq('status', 'answered')
    }

    const { data, error } = await query
    if (!error && data) {
      setTickets(data)
    }
    setLoading(false)
  }

  const handleReply = async (id: string) => {
    const text = replyText[id]
    if (!text || !text.trim()) return

    setReplying(prev => ({ ...prev, [id]: true }))
    
    const { error } = await supabase
      .from('bazzar_tickets')
      .update({ admin_reply: text, status: 'answered', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Ошибка при отправке ответа')
    } else {
      toast.success('Ответ отправлен')
      setReplyText(prev => ({ ...prev, [id]: '' }))
      loadTickets()
    }
    setReplying(prev => ({ ...prev, [id]: false }))
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Bazzar Serts - Претензии и предложения</h1>
        
        <div className="flex gap-2 p-1 bg-white/[0.02] border border-line rounded-xl">
          <button
            onClick={() => setFilter('open')}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-all ${filter === 'open' ? 'bg-accent text-white shadow-sm' : 'text-mute hover:text-white'}`}
          >
            Открытые
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-all ${filter === 'answered' ? 'bg-accent text-white shadow-sm' : 'text-mute hover:text-white'}`}
          >
            Отвеченные
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[500px]">
        {loading ? (
          <div className="text-mute text-sm text-center py-10">Загрузка...</div>
        ) : tickets.length === 0 ? (
          <div className="text-mute text-sm text-center py-10 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">Нет тикетов</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map(t => (
              <div key={t.id} className="p-5 bg-card border border-line rounded-xl flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'claim' ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      {t.type === 'claim' ? 'Претензия' : t.sub_type === 'site' ? 'Предложение по сайту' : t.sub_type === 'apps' ? 'Предложение по приложениям' : 'Сотрудничество'}
                    </span>
                    <span className="text-xs text-mute font-mono">UDID: {t.udid.substring(0, 12)}...</span>
                  </div>
                  <span className="text-xs text-mute">
                    {format(new Date(t.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </span>
                </div>

                <div className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                  {t.message}
                </div>

                {t.image_url && (
                  <a href={t.image_url} target="_blank" rel="noreferrer" className="block w-fit">
                    <img src={t.image_url} alt="Прикрепленный скриншот" className="max-w-xs max-h-48 rounded-lg border border-line object-contain" />
                  </a>
                )}

                {t.admin_reply ? (
                  <div className="p-3 bg-accent/10 border-l-2 border-accent rounded-r-lg mt-2">
                    <div className="text-xs text-accent font-bold mb-1">Ваш ответ:</div>
                    <div className="text-sm text-white/90">{t.admin_reply}</div>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-3">
                    <textarea 
                      value={replyText[t.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="Написать ответ клиенту..."
                      className="flex-1 min-h-[80px] bg-dark border border-line rounded-lg p-3 text-sm text-white placeholder:text-mute focus:outline-none focus:border-accent resize-y"
                    />
                    <div className="flex flex-col justify-end">
                      <button 
                        onClick={() => handleReply(t.id)}
                        disabled={replying[t.id] || !replyText[t.id]?.trim()}
                        className="h-10 px-6 bg-accent hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        {replying[t.id] ? '...' : 'Ответить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
