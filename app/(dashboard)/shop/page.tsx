'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { useUIStore } from '@/store/ui'
import { Loader2, ShoppingBag, CheckCircle2, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GGSelProducts } from '@/components/shop/GGSelProducts'

type ShopItem = {
  id: string
  title: string
  description: string | null
  price: number
  icon: string
  category: string
  stock: number | null
  is_active: boolean
}

type Purchase = {
  id: string
  item_id: string
  points_spent: number
  status: string
  created_at: string
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  benefit:  { label: 'Привилегия', color: '#22C55E' },
  team:     { label: 'Для команды', color: '#00C2FF' },
  personal: { label: 'Личное',     color: '#6F4FE8' },
  merch:    { label: 'Мерч',       color: '#F59E0B' },
  special:  { label: 'Особое',     color: '#FFC833' },
  general:  { label: 'Общее',      color: '#8B92B4' },
}

function ConfirmModal({
  item,
  userPoints,
  onConfirm,
  onClose,
  loading,
}: {
  item: ShopItem
  userPoints: number
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  const canAfford = userPoints >= item.price
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-[400px] shadow-lg overflow-hidden animate-modal-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">Подтверждение покупки</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-mute hover:text-slate-800 hover:bg-black/[0.05] transition-all inline-flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-6 text-center space-y-4">
          <div className="text-5xl">{item.icon}</div>
          <div>
            <div className="text-[17px] font-bold tracking-tight">{item.title}</div>
            {item.description && <div className="text-[13px] text-mute mt-1">{item.description}</div>}
          </div>
          <div className="rounded-xl bg-bg border border-line p-4 space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-mute">Стоимость</span>
              <span className="font-bold text-gold">{item.price} баллов</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-mute">Ваш баланс</span>
              <span className="font-semibold">{userPoints} баллов</span>
            </div>
            <div className="border-t border-line pt-2 flex justify-between text-[13px]">
              <span className="text-mute">После покупки</span>
              <span className={`font-bold ${canAfford ? 'text-ok' : 'text-err'}`}>
                {userPoints - item.price} баллов
              </span>
            </div>
          </div>
          {!canAfford && (
            <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">
              Недостаточно баллов для покупки
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>Отмена</Button>
          <Button className="flex-1" onClick={onConfirm} disabled={loading || !canAfford}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} />}
            Купить
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  const supabase = createClient()
  const { user, setUser } = useAuthStore()
  const { addToast } = useUIStore()

  const [items, setItems] = useState<ShopItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [buying, setBuying] = useState(false)
  const [category, setCategory] = useState('all')
  const [viewTab, setViewTab] = useState<'internal' | 'ggsel'>('internal')

  useEffect(() => {
    Promise.all([
      supabase.from('shop_items').select('*').eq('is_active', true).order('price'),
      supabase.from('shop_purchases').select('*').eq('user_id', user?.id ?? '').order('created_at', { ascending: false }),
    ]).then(([{ data: itms }, { data: purch }]) => {
      setItems((itms ?? []) as ShopItem[])
      setPurchases((purch ?? []) as Purchase[])
      setLoading(false)
    })
  }, [supabase, user?.id])

  const purchase = async () => {
    if (!selectedItem) return
    setBuying(true)
    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        addToast('Ошибка', json.error ?? 'Не удалось купить', 'err')
      } else {
        addToast('Куплено!', `«${selectedItem.title}» успешно приобретено`, 'ok')
        if (user) setUser({ ...user, points: json.newPoints })
        setPurchases(prev => [{ id: Date.now().toString(), item_id: selectedItem.id, points_spent: selectedItem.price, status: 'pending', created_at: new Date().toISOString() }, ...prev])
        setSelectedItem(null)
      }
    } finally {
      setBuying(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))]
  const filtered = category === 'all' ? items : items.filter(i => i.category === category)

  const purchasedIds = new Set(purchases.map(p => p.item_id))

  return (
    <PageContainer>
      <Header
        title="Магазин товаров"
        subtitle={viewTab === 'internal' ? `Баланс: ${user?.points ?? 0} баллов` : 'Управление товарами GGSel'}
      />

      <div className="flex items-center gap-2 mb-6 p-1 bg-card border border-line rounded-xl w-fit">
        <button
          onClick={() => setViewTab('internal')}
          className={`h-9 px-5 rounded-lg text-[13px] font-semibold transition-all ${
            viewTab === 'internal' ? 'bg-brand text-[#171821] shadow-sm' : 'text-mute hover:text-slate-800'
          }`}
        >
          Внутренние товары
        </button>
        <button
          onClick={() => setViewTab('ggsel')}
          className={`h-9 px-5 rounded-lg text-[13px] font-semibold transition-all ${
            viewTab === 'ggsel' ? 'bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/30 shadow-sm' : 'text-mute hover:text-[#FF9900]'
          }`}
        >
          Витрина GGSel
        </button>
      </div>

      {viewTab === 'internal' ? (
        <>
          {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => {
          const meta = cat === 'all' ? { label: 'Все', color: '#8B92B4' } : (CATEGORY_META[cat] ?? { label: cat, color: '#8B92B4' })
          return (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`h-8 px-4 rounded-full text-[12.5px] font-medium transition-all border ${
                category === cat
                  ? 'text-slate-800 border-transparent'
                  : 'text-mute border-line hover:border-line2 hover:text-slate-800'
              }`}
              style={category === cat ? { background: `${meta.color}28`, borderColor: `${meta.color}60`, color: meta.color } : {}}
            >
              {meta.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-mute" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(item => {
            const meta = CATEGORY_META[item.category] ?? CATEGORY_META.general
            const bought = purchasedIds.has(item.id)
            const canAfford = (user?.points ?? 0) >= item.price
            return (
              <div key={item.id}
                className={`card p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-200 ${
                  canAfford && !bought ? 'hover:border-accent/40' : ''
                }`}
              >
                {/* Subtle gradient accent */}
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                  style={{ background: `radial-gradient(circle at top right, ${meta.color}0F, transparent 70%)` }} />

                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
                      style={{ background: `${meta.color}20`, color: meta.color }}>
                      {meta.label}
                    </span>
                    {item.stock !== null && (
                      <span className="text-[11px] text-mute2">Осталось: {item.stock}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-[15px] font-bold tracking-tight mb-1">{item.title}</div>
                  {item.description && (
                    <div className="text-[12.5px] text-mute leading-relaxed">{item.description}</div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-line">
                  <div className="flex items-center gap-1.5">
                    <Star size={13} className="text-gold" fill="#FFC833" />
                    <span className="text-[17px] font-bold text-gold">{item.price}</span>
                    <span className="text-[12px] text-mute2">баллов</span>
                  </div>

                  {bought ? (
                    <div className="flex items-center gap-1.5 text-ok text-[12.5px] font-semibold">
                      <CheckCircle2 size={15} /> Куплено
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedItem(item)}
                      disabled={!canAfford}
                      className={`flex items-center gap-1.5 h-8 px-4 rounded-xl text-[12.5px] font-semibold transition-all ${
                        canAfford
                          ? 'bg-accent/15 text-accent hover:bg-accent hover:text-white border border-accent/30 hover:border-accent'
                          : 'bg-black/[0.04] text-mute border border-line cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag size={13} />
                      {canAfford ? 'Купить' : 'Мало баллов'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Purchase history */}
      {purchases.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[15px] font-semibold tracking-tight mb-4">История покупок</h3>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line text-mute2 text-[11px] uppercase tracking-[0.1em]">
                  <th className="px-5 py-3 text-left font-semibold">Товар</th>
                  <th className="px-5 py-3 text-left font-semibold">Баллы</th>
                  <th className="px-5 py-3 text-left font-semibold">Статус</th>
                  <th className="px-5 py-3 text-left font-semibold">Дата</th>
                </tr>
              </thead>
              <tbody>
                {purchases.slice(0, 10).map(p => {
                  const itm = items.find(i => i.id === p.item_id)
                  return (
                    <tr key={p.id} className="border-b border-line last:border-0 hover:bg-black/[0.02] transition-colors">
                      <td className="px-5 py-3 font-medium">
                        {itm ? `${itm.icon} ${itm.title}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-gold font-semibold">-{p.points_spent}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.status === 'approved' ? 'bg-ok/15 text-ok' :
                          p.status === 'rejected' ? 'bg-err/15 text-err' :
                          'bg-warn/15 text-warn'
                        }`}>
                          {p.status === 'approved' ? 'Одобрено' : p.status === 'rejected' ? 'Отклонено' : 'На рассмотрении'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-mute2">
                        {new Date(p.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      ) : (
        <GGSelProducts />
      )}

      {selectedItem && (
        <ConfirmModal
          item={selectedItem}
          userPoints={user?.points ?? 0}
          onConfirm={purchase}
          onClose={() => setSelectedItem(null)}
          loading={buying}
        />
      )}
    </PageContainer>
  )
}
