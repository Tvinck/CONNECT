'use client'

import { useState } from 'react'
import { Edit2, ExternalLink, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useUIStore } from '@/store/ui'
import { Tag } from '@/components/ui/Tag'

// Моковые данные для GGSel
const MOCK_GGSEL_PRODUCTS = [
  { id: '1001', name: 'Сертификат Apple (Базовый)', price: 400, stock: 150, sales: 1042, status: 'active', url: 'https://ggsel.com/catalog/product/1001' },
  { id: '1002', name: 'Сертификат Apple ESign', price: 450, stock: 89, sales: 856, status: 'active', url: 'https://ggsel.com/catalog/product/1002' },
  { id: '1003', name: 'Сертификат Apple GBox', price: 450, stock: 120, sales: 432, status: 'active', url: 'https://ggsel.com/catalog/product/1003' },
  { id: '1004', name: 'Сертификат Apple Scarlet', price: 450, stock: 0, sales: 521, status: 'out_of_stock', url: 'https://ggsel.com/catalog/product/1004' },
  { id: '1005', name: 'VIP Сертификат Apple', price: 900, stock: 45, sales: 128, status: 'active', url: 'https://ggsel.com/catalog/product/1005' },
]

export function GGSelProducts() {
  const [products, setProducts] = useState(MOCK_GGSEL_PRODUCTS)
  const [editingProduct, setEditingProduct] = useState<typeof MOCK_GGSEL_PRODUCTS[0] | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [saving, setSaving] = useState(false)
  
  const { addToast } = useUIStore()

  const handleEdit = (p: typeof MOCK_GGSEL_PRODUCTS[0]) => {
    setEditingProduct(p)
    setEditPrice(p.price.toString())
  }

  const handleSave = () => {
    if (!editingProduct) return
    setSaving(true)
    
    // Имитация API запроса
    setTimeout(() => {
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...p, price: Number(editPrice) } : p
      ))
      addToast('Цена обновлена', `Новая цена успешно отправлена в GGSel`, 'ok')
      setSaving(false)
      setEditingProduct(null)
    }, 600)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold tracking-tight">Ваши товары на GGSel</h3>
        <span className="text-[12px] text-mute">API: Демо режим</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-mute2">
              <th className="text-left px-5 py-3 font-semibold">ID Товар</th>
              <th className="text-left px-5 py-3 font-semibold">Название</th>
              <th className="text-left px-5 py-3 font-semibold">Цена</th>
              <th className="text-left px-5 py-3 font-semibold">Остаток</th>
              <th className="text-left px-5 py-3 font-semibold">Продажи</th>
              <th className="text-left px-5 py-3 font-semibold">Статус</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5 text-mute font-mono">{p.id}</td>
                <td className="px-5 py-3.5 font-medium flex items-center gap-2">
                  <Package size={14} className="text-accent" />
                  {p.name}
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-mute hover:text-white transition-colors" title="Открыть на GGSel">
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td className="px-5 py-3.5 font-bold tabular-nums text-gold">{p.price} ₽</td>
                <td className="px-5 py-3.5">
                  <span className={p.stock > 0 ? 'text-ok' : 'text-err'}>{p.stock} шт.</span>
                </td>
                <td className="px-5 py-3.5 text-mute tabular-nums">{p.sales.toLocaleString('ru')}</td>
                <td className="px-5 py-3.5">
                  <Tag tone={p.status === 'active' ? 'ok' : 'err'}>
                    {p.status === 'active' ? 'Активен' : 'Нет в наличии'}
                  </Tag>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button 
                    onClick={() => handleEdit(p)}
                    className="h-7 px-3 rounded-lg border border-line text-[11px] font-semibold text-mute hover:text-white hover:border-line2 transition-all flex items-center gap-1.5 ml-auto"
                  >
                    <Edit2 size={11} /> Изменить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <Modal
          title="Редактирование товара"
          onClose={() => setEditingProduct(null)}
          maxWidth="max-w-[400px]"
          footer={
            <>
              <Button variant="ghost" className="flex-1" onClick={() => setEditingProduct(null)} disabled={saving}>Отмена</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Обновить в GGSel'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Название</label>
              <input disabled value={editingProduct.name} className="w-full h-10 px-3.5 rounded-xl bg-white/[0.02] border border-line text-[13.5px] text-mute cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Цена (Руб)</label>
              <input 
                value={editPrice} 
                onChange={e => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all font-bold text-gold tabular-nums" 
                autoFocus
              />
            </div>
            <div className="text-[12px] text-mute bg-accent/10 border border-accent/20 rounded-xl p-3">
              Новая цена моментально обновится на витрине GGSel через API после сохранения.
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
