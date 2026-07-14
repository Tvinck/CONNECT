'use client'

import { useState } from 'react'
import { X, ShieldAlert, ShieldCheck, Activity, Users, CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { getInitials, colorFor, fmtRub } from '@/lib/utils'

interface ManageVpnSubModalProps {
  sub: any
  allSubs: any[]
  allOrders: any[]
  onClose: () => void
  onUpdate: (updatedSub: any) => void
}

export function ManageVpnSubModal({ sub, allSubs, allOrders, onClose, onUpdate }: ManageVpnSubModalProps) {
  const supabase = createClient()
  const addToast = useUIStore(s => s.addToast)

  const [loading, setLoading] = useState(false)
  const [trafficLimitInput, setTrafficLimitInput] = useState<string>(
    sub.traffic_limit ? String(sub.traffic_limit / (1024 * 1024 * 1024)) : ''
  )
  const [ipLimitInput, setIpLimitInput] = useState<string>(
    sub.ip_limit ? String(sub.ip_limit) : '3'
  )

  const relatedSubs = allSubs.filter(s => s.username === sub.username && s.id !== sub.id)
  const relatedOrders = allOrders.filter(o => o.username === sub.username)

  const isBlocked = sub.status === 'blocked'

  const toggleBlock = async () => {
    setLoading(true)
    const newStatus = isBlocked ? 'active' : 'blocked'
    const { error } = await supabase
      .from('vpn_subscriptions')
      .update({ status: newStatus })
      .eq('id', sub.id)

    setLoading(false)
    if (error) {
      addToast('Ошибка', `Не удалось ${isBlocked ? 'разблокировать' : 'заблокировать'} пользователя`, 'err')
      return
    }

    addToast('Успешно', `Пользователь ${isBlocked ? 'разблокирован' : 'заблокирован'}`, 'ok')
    onUpdate({ ...sub, status: newStatus })
  }

  const updateTrafficLimit = async () => {
    setLoading(true)
    
    let newLimit: number | null = null
    if (trafficLimitInput.trim() !== '') {
      const gb = Number(trafficLimitInput)
      if (isNaN(gb) || gb <= 0) {
        setLoading(false)
        addToast('Ошибка', 'Введите корректное число гигабайт', 'err')
        return
      }
      newLimit = gb * 1024 * 1024 * 1024
    }

    const { error } = await supabase
      .from('vpn_subscriptions')
      .update({ traffic_limit: newLimit })
      .eq('id', sub.id)

    setLoading(false)
    if (error) {
      addToast('Ошибка', 'Не удалось обновить лимит трафика', 'err')
      return
    }

    addToast('Успешно', 'Лимит трафика обновлен', 'ok')
    onUpdate({ ...sub, traffic_limit: newLimit })
  }

  const updateIpLimit = async () => {
    setLoading(true)
    const limit = Number(ipLimitInput)
    if (isNaN(limit) || limit <= 0) {
      setLoading(false)
      addToast('Ошибка', 'Введите корректный лимит устройств', 'err')
      return
    }

    const { error } = await supabase
      .from('vpn_subscriptions')
      .update({ ip_limit: limit })
      .eq('id', sub.id)

    setLoading(false)
    if (error) {
      addToast('Ошибка', 'Не удалось обновить лимит устройств', 'err')
      return
    }

    addToast('Успешно', 'Лимит устройств обновлен', 'ok')
    onUpdate({ ...sub, ip_limit: limit })
  }

  const usedGb = (sub.traffic_used / (1024 * 1024 * 1024)).toFixed(2)
  const limitGb = sub.traffic_limit ? (sub.traffic_limit / (1024 * 1024 * 1024)).toFixed(2) : 'Безлимит'
  const progressPercent = sub.traffic_limit ? Math.min(100, (sub.traffic_used / sub.traffic_limit) * 100) : 0

  return (
    <Modal onClose={onClose} className="relative bg-bg text-[#171821] border border-line rounded-2xl w-full max-w-[800px] flex flex-col shadow-2xl animate-modal-in my-auto overflow-hidden p-0">
      {/* Header Profile */}
      <div className="p-6 border-b border-line bg-bg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar initials={getInitials(sub.username)} color={colorFor(sub.username)} size={56} />
            <div>
              <h2 className="text-[20px] font-bold tracking-tight flex items-center gap-2">
                {sub.username}
                <Tag tone={isBlocked ? 'err' : sub.status === 'active' ? 'ok' : 'mute'}>
                  {isBlocked ? 'Заблокирован' : sub.status === 'active' ? 'Активен' : 'Истекла'}
                </Tag>
              </h2>
              {sub.telegram_username && (
                <div className="text-[13px] text-mute mt-1 font-mono">@{sub.telegram_username}</div>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Закрыть" className="w-8 h-8 flex items-center justify-center text-mute hover:text-[#171821] rounded-lg hover:bg-bg transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Telegram Quests Status */}
        <div className="mt-5 flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 ${sub.tg_bot_linked ? 'bg-ok/10 border-ok/20 text-ok' : 'bg-bg border-line text-mute'}`}>
            {sub.tg_bot_linked ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            TG Бот {sub.tg_bot_linked ? 'Привязан' : 'Не привязан'}
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 ${sub.tg_channel_subscribed ? 'bg-ok/10 border-ok/20 text-ok' : 'bg-bg border-line text-mute'}`}>
            {sub.tg_channel_subscribed ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            TG Канал {sub.tg_channel_subscribed ? 'Подписан' : 'Не подписан'}
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-line bg-bg text-mute text-[11px] font-bold inline-flex items-center gap-1.5">
            <Activity size={13} />
            Лимит: {sub.ip_limit || 3} устр.
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-6 h-[500px] overflow-y-auto">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* Traffic Management */}
          <div className="card p-4 bg-bg">
            <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-4">
              <Activity size={14} className="text-accent" />
              Управление трафиком
            </h3>
            
            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-mute font-mono mb-1.5">
                <span>Использовано: {usedGb} GiB</span>
                <span>Лимит: {limitGb} {sub.traffic_limit && 'GiB'}</span>
              </div>
              <div className="h-2 w-full bg-black/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="number"
                placeholder="Безлимит"
                value={trafficLimitInput}
                onChange={e => setTrafficLimitInput(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-line bg-bg px-3 text-[13px] outline-none"
              />
              <Button size="sm" onClick={updateTrafficLimit} disabled={loading}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : 'Установить ГБ'}
              </Button>
            </div>
          </div>

          {/* IP Limit Management */}
          <div className="card p-4 bg-bg">
            <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-4">
              <Users size={14} className="text-accent" />
              Лимит устройств (IP)
            </h3>
            <div className="flex gap-2">
              <input 
                type="number"
                min={1}
                max={10}
                placeholder="3"
                value={ipLimitInput}
                onChange={e => setIpLimitInput(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-line bg-bg px-3 text-[13px] outline-none"
              />
              <Button size="sm" onClick={updateIpLimit} disabled={loading}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : 'Установить лимит'}
              </Button>
            </div>
          </div>

          {/* Block / Unblock */}
          <div className="card p-4 bg-bg">
            <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-3">
              {isBlocked ? <ShieldCheck size={14} className="text-ok" /> : <ShieldAlert size={14} className="text-err" />}
              Доступ к сети
            </h3>
            <p className="text-[12px] text-mute mb-4">
              {isBlocked 
                ? 'Пользователь временно отключен от серверов. Вы можете восстановить доступ.' 
                : 'Вы можете заблокировать пользователя. Ключ перестанет работать на всех серверах.'}
            </p>
            <Button 
              size="sm" 
              className={isBlocked ? 'bg-ok/10 text-ok hover:bg-ok/20' : 'bg-err/10 text-err hover:bg-err/20'} 
              onClick={toggleBlock} 
              disabled={loading}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : (isBlocked ? 'Разблокировать пользователя' : 'Временно заблокировать')}
            </Button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Related Orders */}
          <div className="card p-4 bg-bg">
            <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-3">
              <CreditCard size={14} className="text-ok" />
              История платежей
            </h3>
            {relatedOrders.length === 0 ? (
              <div className="text-[12px] text-mute py-4 text-center">Платежей пока не было</div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
                {relatedOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-bg">
                    <div>
                      <div className="text-[13px] font-bold text-ok">+{o.amount} {o.currency}</div>
                      <div className="text-[11px] text-mute mt-0.5">{new Date(o.created_at).toLocaleDateString('ru-RU')} • {o.tariff_months} мес.</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${o.status === 'paid' ? 'bg-ok/10 text-ok' : 'bg-err/10 text-err'}`}>
                      {o.status === 'paid' ? 'Успешно' : 'Ошибка'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Subscriptions */}
          <div className="card p-4 bg-bg">
            <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-3">
              <Users size={14} className="text-accent" />
              Другие подписки аккаунта
            </h3>
            {relatedSubs.length === 0 ? (
              <div className="text-[12px] text-mute py-4 text-center">Других подписок не найдено</div>
            ) : (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2">
                {relatedSubs.map(s => (
                  <div key={s.id} className="flex flex-col p-2.5 rounded-lg border border-line bg-bg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-mono text-mute2 truncate max-w-[150px]">{s.subscription_key}</span>
                      <Tag tone={s.status === 'active' ? 'ok' : 'err'}>{s.status}</Tag>
                    </div>
                    <div className="text-[11px] text-mute">
                      Истекает: {new Date(s.expires_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </Modal>
  )
}
