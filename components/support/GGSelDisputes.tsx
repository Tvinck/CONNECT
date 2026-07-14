'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, MessageSquare, CornerDownRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Tag } from '@/components/ui/Tag'
import { useUIStore } from '@/store/ui'

const MOCK_DISPUTES = [
  { 
    id: 'DSP-8492', 
    order_id: 'ORD-123456',
    item_name: 'Сертификат Apple ESign',
    client: 'Иван И.', 
    reason: 'Не пришел ключ на почту', 
    status: 'open', 
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours left
    messages: [
      { author: 'Иван И.', text: 'Оплатил час назад, на почте ничего нет. Папку спам проверял.', time: '10:12', isSeller: false }
    ]
  },
  { 
    id: 'DSP-8490', 
    order_id: 'ORD-123300',
    item_name: 'VIP Сертификат Apple',
    client: 'Alex22', 
    reason: 'Сертификат отозван', 
    status: 'urgent', 
    deadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour left
    messages: [
      { author: 'Alex22', text: 'Сертификат перестал работать, пишет приложение недоступно', time: 'Вчера 22:15', isSeller: false },
      { author: 'Вы (Продавец)', text: 'Здравствуйте! Укажите ваш UDID для проверки в базе Apple.', time: 'Вчера 23:00', isSeller: true },
      { author: 'Alex22', text: '00008110-00123456789ABCDE', time: 'Сегодня 08:30', isSeller: false }
    ]
  },
  { 
    id: 'DSP-8451', 
    order_id: 'ORD-122110',
    item_name: 'Сертификат Apple (Базовый)',
    client: 'Maria', 
    reason: 'Случайная покупка', 
    status: 'closed', 
    deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired/Closed
    messages: [
      { author: 'Maria', text: 'Ошиблась товаром, верните деньги', time: '02.06.2026', isSeller: false },
      { author: 'Вы (Продавец)', text: 'Возврат оформлен.', time: '02.06.2026', isSeller: true }
    ]
  }
]

export function GGSelDisputes() {
  const [selectedDispute, setSelectedDispute] = useState<typeof MOCK_DISPUTES[0] | null>(null)
  const [replyText, setReplyText] = useState('')
  const [processing, setProcessing] = useState(false)
  const { addToast } = useUIStore()

  const handleReply = () => {
    if (!replyText.trim() || !selectedDispute) return
    setProcessing(true)
    setTimeout(() => {
      addToast('Ответ отправлен', 'Сообщение доставлено клиенту в GGSel', 'ok')
      setReplyText('')
      setProcessing(false)
      setSelectedDispute(null)
    }, 800)
  }

  const handleRefund = () => {
    if (!confirm('Вы уверены, что хотите сделать возврат средств? Спор будет закрыт.')) return
    setProcessing(true)
    setTimeout(() => {
      addToast('Возврат оформлен', 'Средства возвращены покупателю', 'ok')
      setProcessing(false)
      setSelectedDispute(null)
    }, 800)
  }

  const getTimeLeft = (deadlineStr: string, status: string) => {
    if (status === 'closed') return 'Спор закрыт'
    const diff = new Date(deadlineStr).getTime() - Date.now()
    if (diff <= 0) return 'Время вышло'
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${h} ч ${m} мин`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">Активные споры GGSel</h3>
          <p className="text-[12.5px] text-mute mt-1">Ответьте клиентам до истечения времени, чтобы избежать авто-возврата.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {MOCK_DISPUTES.map(d => {
          const timeLeft = getTimeLeft(d.deadline, d.status)
          const isUrgent = d.status === 'urgent'
          const isClosed = d.status === 'closed'
          
          return (
            <div 
              key={d.id} 
              className={`card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all border ${
                isUrgent ? 'border-err/40 bg-err/5' : 'border-line hover:border-line2'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[12px] font-mono text-mute">{d.id}</span>
                  <Tag tone={isClosed ? 'mute' : isUrgent ? 'err' : 'warn'}>
                    {isClosed ? 'Закрыт' : 'Ожидает ответа'}
                  </Tag>
                  {!isClosed && (
                    <span className={`text-[12px] flex items-center gap-1 font-semibold ${isUrgent ? 'text-err animate-pulse' : 'text-warn'}`}>
                      <Clock size={13} /> Осталось {timeLeft}
                    </span>
                  )}
                </div>
                <div className="text-[14px] font-semibold mb-1">{d.reason}</div>
                <div className="text-[12.5px] text-mute flex items-center gap-2">
                  <span>Заказ: <span className="text-slate-800">{d.order_id}</span></span>
                  <span>•</span>
                  <span>Товар: <span className="text-slate-800">{d.item_name}</span></span>
                  <span>•</span>
                  <span>Клиент: {d.client}</span>
                </div>
              </div>

              <div>
                <button 
                  onClick={() => setSelectedDispute(d)}
                  className="h-9 px-4 rounded-lg bg-black/[0.04] border border-line text-[13px] font-semibold hover:bg-black/[0.07] hover:text-slate-800 transition-all w-full md:w-auto"
                >
                  {isClosed ? 'Просмотр' : 'Открыть спор'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedDispute && (
        <Modal
          title={`Спор ${selectedDispute.id}`}
          onClose={() => setSelectedDispute(null)}
          maxWidth="max-w-[600px]"
          footer={
            selectedDispute.status !== 'closed' ? (
              <div className="flex items-center justify-between w-full gap-4">
                <Button variant="ghost" className="text-err hover:bg-err/10 hover:text-err" onClick={handleRefund} disabled={processing}>
                  Сделать возврат
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setSelectedDispute(null)} disabled={processing}>Закрыть</Button>
                  <Button onClick={handleReply} disabled={processing || !replyText.trim()}>
                    {processing ? 'Отправка...' : 'Ответить'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setSelectedDispute(null)}>Закрыть</Button>
            )
          }
        >
          <div className="space-y-6">
            <div className="bg-bg border border-line rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[13px] text-mute">Причина спора</span>
                <span className="text-[13px] font-bold text-slate-800">{selectedDispute.reason}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[13px] text-mute">Товар</span>
                <span className="text-[13px] text-slate-800">{selectedDispute.item_name}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[12px] uppercase tracking-wider text-mute font-bold flex items-center gap-2">
                <MessageSquare size={14} /> Переписка
              </h4>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {selectedDispute.messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.isSeller ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[11.5px] font-semibold text-slate-600">{msg.author}</span>
                      <span className="text-[10px] text-mute">{msg.time}</span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-xl text-[13px] max-w-[85%] ${
                      msg.isSeller
                        ? 'bg-accent/15 text-slate-800 border border-accent/30 rounded-tr-sm'
                        : 'bg-line2 text-slate-800 border border-line rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedDispute.status !== 'closed' && (
              <div className="pt-2">
                <textarea 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Ваш ответ клиенту..." 
                  className="w-full h-24 bg-bg border border-line rounded-xl p-3 text-[13px] text-slate-800 placeholder-mute2 outline-none focus:border-accent/50 transition-colors resize-none"
                />
                <div className="text-[11.5px] text-mute mt-2 flex items-start gap-1.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  Ответ будет отправлен от имени вашего магазина напрямую в чат GGSel.
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
