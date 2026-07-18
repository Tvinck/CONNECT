'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, RotateCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { money, dateTime } from './kit'

interface Sub {
  id: string
  udid: string
  app_id: string | null
  app_name: string | null
  plan: string
  price: number
  status: string
  started_at: string
  expires_at: string | null
  auto_renew: boolean
  created_at: string
}
interface App {
  id: string
  name: string
  is_active: boolean
}

const PLAN_MONTHS: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }
const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Активна', color: '#22C55E' },
  expired: { label: 'Истекла', color: '#F59E0B' },
  cancelled: { label: 'Отменена', color: '#EF4444' },
}

export function SubscriptionsSection({ subs, apps, ready }: { subs: Sub[]; apps: App[]; ready: boolean }) {
  const router = useRouter()
  const { addToast } = useUIStore()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  const [udid, setUdid] = useState('')
  const [appId, setAppId] = useState('')
  const [plan, setPlan] = useState('1m')
  const [price, setPrice] = useState('')

  if (!ready) {
    return (
      <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-5">
        <h1 className="text-[22px] font-bold tracking-tight">Подписки</h1>
        <div className="card p-8 text-center">
          <div className="text-[14px] font-semibold mb-2">Таблица подписок ещё не создана</div>
          <div className="text-[13px] text-mute">Примените миграцию <code>20260718_bazzar_variants_subscriptions.sql</code> — и раздел заработает.</div>
        </div>
      </div>
    )
  }

  const add = () => {
    if (!udid.trim()) { addToast('Укажите UDID клиента', undefined, 'warn'); return }
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const months = PLAN_MONTHS[plan] || 1
        const expires = new Date(Date.now() + months * 30 * 86400000).toISOString()
        const app = apps.find((a) => a.id === appId)
        const { error } = await supabase.from('bazzar_subscriptions').insert({
          udid: udid.trim(),
          app_id: appId || null,
          app_name: app?.name || null,
          plan,
          price: Number(price) || 0,
          status: 'active',
          expires_at: expires,
          created_by: user?.id ?? null,
        })
        if (error) throw error
        addToast('Подписка добавлена', undefined, 'ok')
        setUdid(''); setAppId(''); setPrice(''); setPlan('1m'); setShowForm(false)
        router.refresh()
      } catch (e: any) {
        addToast('Ошибка', e.message || '', 'err')
      }
    })
  }

  const cancel = (id: string) => {
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.from('bazzar_subscriptions').update({ status: 'cancelled' }).eq('id', id)
        if (error) throw error
        addToast('Подписка отменена', undefined, 'ok')
        router.refresh()
      } catch (e: any) {
        addToast('Ошибка', e.message || '', 'err')
      }
    })
  }

  const extend = (s: Sub) => {
    startTransition(async () => {
      try {
        const supabase = createClient()
        const months = PLAN_MONTHS[s.plan] || 1
        const base = s.expires_at && new Date(s.expires_at).getTime() > Date.now() ? new Date(s.expires_at).getTime() : Date.now()
        const expires = new Date(base + months * 30 * 86400000).toISOString()
        const { error } = await supabase.from('bazzar_subscriptions').update({ expires_at: expires, status: 'active' }).eq('id', s.id)
        if (error) throw error
        addToast(`Продлено на ${months} мес.`, undefined, 'ok')
        router.refresh()
      } catch (e: any) {
        addToast('Ошибка', e.message || '', 'err')
      }
    })
  }

  // Эффективный статус с учётом даты истечения (авто-истечение на клиенте)
  const effective = (s: Sub): string =>
    s.status === 'active' && s.expires_at && new Date(s.expires_at).getTime() < Date.now() ? 'expired' : s.status

  const active = subs.filter((s) => effective(s) === 'active')

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Подписки <span className="text-mute font-normal text-[15px]">· активных {active.length}</span></h1>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-[#171821] text-[13px] font-semibold">
          <Plus size={16} /> Добавить
        </button>
      </div>

      {showForm && (
        <div className="card p-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <Field label="UDID клиента"><input value={udid} onChange={(e) => setUdid(e.target.value)} placeholder="00008…" className="b2-input" /></Field>
          <Field label="Приложение">
            <select value={appId} onChange={(e) => setAppId(e.target.value)} className="b2-input">
              <option value="">— выбрать —</option>
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="План">
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="b2-input">
              <option value="1m">1 месяц</option>
              <option value="3m">3 месяца</option>
              <option value="6m">6 месяцев</option>
              <option value="12m">12 месяцев</option>
            </select>
          </Field>
          <Field label="Цена, ₽"><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="0" className="b2-input" /></Field>
          <button disabled={pending} onClick={add} className="px-4 py-2.5 rounded-xl bg-ok text-white text-[13px] font-semibold disabled:opacity-50">
            {pending ? 'Добавляем…' : 'Создать подписку'}
          </button>
        </div>
      )}

      <div className="card">
        <div className="divide-y divide-black/[0.05]">
          {subs.length === 0 && <div className="p-10 text-center text-mute">Подписок пока нет.</div>}
          {subs.map((s) => {
            const eff = effective(s)
            const st = STATUS[eff] || { label: eff, color: '#8B92B4' }
            return (
              <div key={s.id} className="p-3.5 flex items-center gap-4 text-[13px]">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.app_name || 'Приложение'} · {s.plan}</div>
                  <div className="text-[11px] text-mute">UDID <code>{s.udid.slice(0, 10)}…</code> · до {s.expires_at ? dateTime(s.expires_at) : '—'}</div>
                </div>
                <span className="shrink-0 tabular-nums font-semibold">{money(s.price)}</span>
                <span className="shrink-0 px-2 py-1 rounded-lg text-[12px] font-semibold" style={{ background: `${st.color}1a`, color: st.color }}>{st.label}</span>
                {eff !== 'cancelled' && (
                  <button onClick={() => extend(s)} disabled={pending} className="shrink-0 inline-flex items-center gap-1 text-accent text-[12px] disabled:opacity-50" title="Продлить">
                    <RotateCw size={13} /> Продлить
                  </button>
                )}
                {eff === 'active' && (
                  <button onClick={() => cancel(s.id)} disabled={pending} className="shrink-0 inline-flex items-center gap-1 text-err text-[12px] disabled:opacity-50">
                    <X size={14} /> Отменить
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-mute mb-1.5">{label}</span>
      {children}
    </label>
  )
}
