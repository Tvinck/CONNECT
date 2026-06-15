'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2, Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useUIStore }   from '@/store/ui'
import { useAuthStore } from '@/store/auth'
import type { PMProduct } from './types'

type Promo = { id: string; code: string; discount: number; uses: number; source?: string | null }

interface Props {
  products: PMProduct[]
  initialPromos: Promo[]
}

export function SettingsTab({ products: initialProducts, initialPromos }: Props) {
  const supabase = createClient()
  const addToast = useUIStore(s => s.addToast)
  const { user } = useAuthStore()
  const isCeoOrCoowner = user?.role === 'ceo' || user?.role === 'coowner'

  const [products,    setProducts]    = useState<PMProduct[]>(initialProducts)
  const [editing,     setEditing]     = useState<string | null>(null)
  const [editPrice,   setEditPrice]   = useState('')
  const [editCost,    setEditCost]    = useState('')
  const [editActive,  setEditActive]  = useState(true)
  const [saving,      setSaving]      = useState(false)

  const [promos,      setPromos]      = useState<Promo[]>(initialPromos)
  const [newCode,     setNewCode]     = useState('')
  const [newDisc,     setNewDisc]     = useState('')
  const [newSource,   setNewSource]   = useState('')
  const [savingPromo, setSavingPromo] = useState(false)
  const [copiedCode,  setCopiedCode]  = useState<string | null>(null)

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 1500)
    })
  }

  // ─── product actions ────────────────────────────────────────────────────────

  const startEdit = (p: PMProduct) => {
    setEditing(p.id)
    setEditPrice(String(p.price))
    setEditCost(String(p.cost))
    setEditActive(p.is_active)
  }

  const cancelEdit = () => setEditing(null)

  const saveProduct = async (p: PMProduct) => {
    const price = parseFloat(editPrice)
    const cost  = parseFloat(editCost)
    if (!price || price <= 0) { addToast('Ошибка', 'Некорректная цена', 'err'); return }
    setSaving(true)
    const { data, error } = await supabase
      .from('pm_products')
      .update({ price, cost: cost || 0, is_active: editActive, updated_at: new Date().toISOString() })
      .eq('id', p.id)
      .select('*')
      .single()
    setSaving(false)
    if (error) { addToast('Ошибка', error.message, 'err'); return }
    setProducts(prev => prev.map(x => x.id === p.id ? (data as PMProduct) : x))
    setEditing(null)
    addToast('Готово', `${p.name} обновлён`, 'ok')
  }

  // ─── promo actions ───────────────────────────────────────────────────────────

  const addPromo = async () => {
    const disc = parseInt(newDisc)
    if (!newCode.trim() || !disc || disc < 1 || disc > 99) {
      addToast('Ошибка', 'Укажите код и скидку (1–99%)', 'err'); return
    }
    const code = newCode.trim().toUpperCase()
    if (promos.some(p => p.code === code)) {
      addToast('Ошибка', 'Такой промокод уже существует', 'err'); return
    }
    setSavingPromo(true)
    const { data, error } = await supabase
      .from('pm_promos')
      .insert({ code, discount: disc, source: newSource.trim() || null })
      .select('*')
      .single()
    setSavingPromo(false)
    if (error) { addToast('Ошибка', error.message, 'err'); return }
    setPromos(prev => [data as Promo, ...prev])
    setNewCode(''); setNewDisc(''); setNewSource('')
    addToast('Готово', `Промокод ${code} добавлен`, 'accent')
  }

  const deletePromo = async (id: string) => {
    const snapshot = promos
    setPromos(prev => prev.filter(p => p.id !== id))
    const { error } = await supabase.from('pm_promos').delete().eq('id', id)
    if (error) { addToast('Ошибка', error.message, 'err'); setPromos(snapshot) }
  }

  return (
    <div className="space-y-6">
      {!isCeoOrCoowner && (
        <div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-line text-[12.5px] text-mute">
          🔒 Редактирование цен и промокодов доступно только руководству.
        </div>
      )}
      {/* Products */}
      <div className="card p-5">
        <h3 className="text-[15px] font-semibold mb-4">Продукты и цены</h3>
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className={`rounded-xl border p-4 transition-colors ${editing === p.id ? 'border-accent/40 bg-accent/5' : 'border-line bg-white/[0.02]'}`}>
              <div className="flex items-start gap-3">
                <span className="text-[28px] shrink-0">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-semibold">{p.name}</span>
                    {!p.is_active && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-err/20 text-err">ОТКЛ</span>
                    )}
                  </div>
                  <div className="text-[12px] text-mute mb-3">{p.description}</div>

                  {editing === p.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-mute2 uppercase tracking-wider font-semibold mb-1 block">Цена клиенту, ₽</label>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-line focus:border-accent/60 outline-none text-[13.5px] font-bold tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-mute2 uppercase tracking-wider font-semibold mb-1 block">Себестоимость, ₽</label>
                          <input
                            type="number"
                            value={editCost}
                            onChange={e => setEditCost(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-line focus:border-accent/60 outline-none text-[13.5px] tabular-nums"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={e => setEditActive(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-[12.5px] text-mute">Продукт активен</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => saveProduct(p)} disabled={saving}>
                          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          Сохранить
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
                          <X size={13} /> Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-[11px] text-mute2">Цена</div>
                        <div className="text-[20px] font-bold tabular-nums text-ok">{p.price.toLocaleString('ru-RU')} ₽</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-mute2">Себест.</div>
                        <div className="text-[14px] font-semibold tabular-nums text-err">~{p.cost} ₽</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-mute2">Маржа</div>
                        <div className="text-[14px] font-semibold tabular-nums text-accent">
                          {Math.round(((p.price - p.cost) / p.price) * 100)}%
                        </div>
                      </div>
                      {isCeoOrCoowner && (
                        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => startEdit(p)}>
                          <Pencil size={13} /> Изменить
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promo codes */}
      <div className="card p-5">
        <h3 className="text-[15px] font-semibold mb-1">Промокоды</h3>
        <p className="text-[12px] text-mute mb-4">Скидки для рекламы на Авито и других каналах</p>

        {promos.length === 0 && (
          <div className="text-center py-6 text-mute text-[12.5px]">Промокодов пока нет</div>
        )}

        <div className="space-y-2 mb-4">
          {promos.map(promo => (
            <div key={promo.id} className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.025] border border-line rounded-xl">
              <code className="text-[14px] font-bold font-mono text-accent">{promo.code}</code>
              {promo.source && (
                <span className="text-[10.5px] px-1.5 h-4 rounded bg-white/[0.06] text-mute font-medium">{promo.source}</span>
              )}
              <div className="flex-1" />
              <span className="text-[13px] font-semibold text-ok">−{promo.discount}%</span>
              <span className="text-[11px] text-mute">{promo.uses} исп.</span>
              <button
                onClick={() => copyCode(promo.code)}
                title="Скопировать"
                className="text-mute hover:text-white transition-colors"
                aria-label="Скопировать промокод"
              >
                {copiedCode === promo.code
                  ? <Check size={13} className="text-ok" />
                  : <Copy size={13} />}
              </button>
              {isCeoOrCoowner && (
                <button
                  onClick={() => deletePromo(promo.id)}
                  className="text-mute hover:text-err transition-colors"
                  aria-label="Удалить промокод"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add promo */}
        {isCeoOrCoowner && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value.toUpperCase())}
              placeholder="КОД"
              className="w-36 h-9 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] font-mono font-bold placeholder:font-normal placeholder:text-mute2"
            />
            <input
              type="number"
              value={newDisc}
              onChange={e => setNewDisc(e.target.value)}
              placeholder="Скидка %"
              min={1}
              max={99}
              className="w-24 h-9 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px]"
            />
            <input
              value={newSource}
              onChange={e => setNewSource(e.target.value.toLowerCase())}
              placeholder="Канал (avito, vk...)"
              className="w-36 h-9 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2"
            />
            <Button size="sm" onClick={addPromo} disabled={savingPromo}>
              {savingPromo ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Добавить
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
