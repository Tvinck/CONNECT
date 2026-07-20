'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { BazzarProductsPanel } from '@/components/projects/ProjectDetail/BazzarProductsPanel'
import { money } from './kit'

interface App { id: string; name: string; version: string; description: string | null; icon_url: string | null; ipa_url: string | null; bundle_id: string | null; is_active: boolean }
interface Product { id: string; title: string; price: number; active: boolean }
interface Variant { id: string; product_id: string; name: string; guarantee_months: number; price: number; api_cost: number; active: boolean }

type Tab = 'products' | 'apps' | 'variants'

export function CatalogSection({ apps, products, variants, variantsReady }: { apps: App[]; products: Product[]; variants: Variant[]; variantsReady: boolean }) {
  const [tab, setTab] = useState<Tab>('products')
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'products', label: 'Товары' },
    { id: 'apps', label: 'Приложения', count: apps.length },
    { id: 'variants', label: 'Варианты сертификатов', count: variants.length },
  ]

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 pb-20 max-w-[1400px] mx-auto space-y-5">
      <h1 className="text-[22px] font-bold tracking-tight">Каталог</h1>
      <div className="flex items-center gap-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold ${tab === t.id ? 'bg-brand text-[#171821]' : 'text-mute hover:bg-black/[0.04]'}`}>
            {t.label}
            {t.count != null && <span className={`min-w-5 px-1.5 rounded-full text-[11px] ${tab === t.id ? 'bg-[#171821] text-brand' : 'bg-black/[0.06]'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'products' && <BazzarProductsPanel />}
      {tab === 'apps' && <AppsManager apps={apps} />}
      {tab === 'variants' && <VariantsManager products={products} variants={variants} ready={variantsReady} />}

    </div>
  )
}

// ── Приложения ──────────────────────────────────────────────────────────────
function AppsManager({ apps }: { apps: App[] }) {
  const router = useRouter()
  const { addToast } = useUIStore()
  const [pending, startTransition] = useTransition()
  const [show, setShow] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [f, setF] = useState({ name: '', version: '1.0', description: '', icon_url: '', ipa_url: '', bundle_id: '' })

  const uploadIcon = async (file: File) => {
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `icons/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`
      const { error } = await supabase.storage.from('bazzar-apps').upload(path, file, { upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('bazzar-apps').getPublicUrl(path)
      setF((prev) => ({ ...prev, icon_url: data.publicUrl }))
      addToast('Иконка загружена', undefined, 'ok')
    } catch (e: any) {
      addToast('Ошибка загрузки', e.message || '', 'err')
    } finally {
      setUploading(false)
    }
  }

  const add = () => {
    if (!f.name.trim()) { addToast('Укажите название', undefined, 'warn'); return }
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.from('bazzar_apps').insert({
          name: f.name.trim(), version: f.version.trim() || '1.0', description: f.description.trim() || null,
          icon_url: f.icon_url.trim() || null, ipa_url: f.ipa_url.trim() || null, bundle_id: f.bundle_id.trim() || null, is_active: true,
        })
        if (error) throw error
        addToast('Приложение добавлено', undefined, 'ok')
        setF({ name: '', version: '1.0', description: '', icon_url: '', ipa_url: '', bundle_id: '' }); setShow(false); router.refresh()
      } catch (e: any) { addToast('Ошибка', e.message || '', 'err') }
    })
  }
  const toggle = (a: App) => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('bazzar_apps').update({ is_active: !a.is_active }).eq('id', a.id)
      if (error) addToast('Ошибка', error.message, 'err'); else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-[#171821] text-[13px] font-semibold"><Plus size={16} /> Приложение</button>
      </div>
      {show && (
        <div className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <L label="Название"><input className="b2-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></L>
          <L label="Версия"><input className="b2-input" value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} /></L>
          <L label="Bundle ID"><input className="b2-input" value={f.bundle_id} onChange={(e) => setF({ ...f, bundle_id: e.target.value })} placeholder="com.example.app" /></L>
          <L label="Иконка (URL или файл)">
            <div className="flex gap-2">
              <input className="b2-input flex-1" value={f.icon_url} onChange={(e) => setF({ ...f, icon_url: e.target.value })} placeholder="URL или загрузите" />
              <label className={`shrink-0 inline-flex items-center px-3 rounded-xl border border-line text-[12px] font-semibold cursor-pointer ${uploading ? 'opacity-50' : 'hover:bg-black/[0.04]'}`}>
                <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadIcon(e.target.files[0])} />
                {uploading ? '…' : 'Файл'}
              </label>
            </div>
          </L>
          <L label="IPA (URL)"><input className="b2-input" value={f.ipa_url} onChange={(e) => setF({ ...f, ipa_url: e.target.value })} /></L>
          <L label="Описание"><input className="b2-input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></L>
          <button disabled={pending} onClick={add} className="px-4 py-2.5 rounded-xl bg-ok text-white text-[13px] font-semibold disabled:opacity-50">{pending ? '…' : 'Добавить'}</button>
        </div>
      )}
      <div className="card divide-y divide-black/[0.05]">
        {apps.length === 0 && <div className="p-10 text-center text-mute">Приложений пока нет.</div>}
        {apps.map((a) => (
          <div key={a.id} className="p-3.5 flex items-center gap-3 text-[13px]">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-black/[0.05] inline-flex items-center justify-center overflow-hidden">
              {a.icon_url ? <img src={a.icon_url} alt="" className="w-full h-full object-cover" /> : <span className="text-mute text-[11px]">app</span>}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{a.name} <span className="text-mute font-normal">v{a.version}</span></div>
              <div className="text-[11px] text-mute truncate">{a.bundle_id || a.description || ''}</div>
            </div>
            <button onClick={() => toggle(a)} disabled={pending} className={`shrink-0 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${a.is_active ? 'bg-ok/15 text-ok' : 'bg-black/[0.06] text-mute'}`}>
              {a.is_active ? 'Активно' : 'Скрыто'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Варианты сертификатов ────────────────────────────────────────────────────
function VariantsManager({ products, variants, ready }: { products: Product[]; variants: Variant[]; ready: boolean }) {
  const router = useRouter()
  const { addToast } = useUIStore()
  const [pending, startTransition] = useTransition()
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [f, setF] = useState({ name: '', months: '1', price: '', cost: '' })

  if (!ready) {
    return <div className="card p-8 text-center"><div className="text-[14px] font-semibold mb-2">Таблица вариантов ещё не создана</div><div className="text-[13px] text-mute">Примените миграцию <code>20260718_bazzar_variants_subscriptions.sql</code>.</div></div>
  }

  const list = variants.filter((v) => v.product_id === productId)
  const add = () => {
    if (!productId) { addToast('Выберите товар', undefined, 'warn'); return }
    if (!f.name.trim()) { addToast('Укажите название варианта', undefined, 'warn'); return }
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.from('bazzar_product_variants').insert({
          product_id: productId, name: f.name.trim(), guarantee_months: Number(f.months) || 0,
          price: Number(f.price) || 0, api_cost: Number(f.cost) || 0, active: true,
        })
        if (error) throw error
        addToast('Вариант добавлен', undefined, 'ok')
        setF({ name: '', months: '1', price: '', cost: '' }); router.refresh()
      } catch (e: any) { addToast('Ошибка', e.message || '', 'err') }
    })
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <L label="Товар">
          <select className="b2-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.length === 0 && <option value="">Нет товаров</option>}
            {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </L>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <L label="Название варианта"><input className="b2-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Гарантия 3 мес" /></L>
        <L label="Гарантия, мес"><input className="b2-input" value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })} inputMode="numeric" /></L>
        <L label="Цена, ₽"><input className="b2-input" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} inputMode="numeric" /></L>
        <L label="Себестоимость, ₽"><input className="b2-input" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} inputMode="numeric" /></L>
        <button disabled={pending} onClick={add} className="px-4 py-2.5 rounded-xl bg-ok text-white text-[13px] font-semibold disabled:opacity-50">{pending ? '…' : 'Добавить вариант'}</button>
      </div>

      <div className="card divide-y divide-black/[0.05]">
        {list.length === 0 && <div className="p-8 text-center text-mute">У товара пока нет вариантов.</div>}
        {list.map((v) => (
          <div key={v.id} className="p-3.5 flex items-center gap-4 text-[13px]">
            <div className="flex-1 min-w-0"><div className="font-semibold">{v.name}</div><div className="text-[11px] text-mute">гарантия {v.guarantee_months} мес · себест. {money(v.api_cost)}</div></div>
            <span className="shrink-0 font-semibold tabular-nums">{money(v.price)}</span>
            <span className="shrink-0 text-ok text-[12px]">маржа {money(v.price - v.api_cost)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[12px] font-semibold text-mute mb-1.5">{label}</span>{children}</label>
}
