'use client';

import { useState, useEffect } from 'react';
import { PackageSearch, Plus, Tag, ToggleLeft, ToggleRight, Edit2, Trash2, Loader2 } from 'lucide-react';
import { getBazzarProducts, toggleProductStatus } from '@/app/actions/bazzar';

export function BazzarProductsPanel() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const res = await getBazzarProducts();
    if (res.success && res.data) {
      setProducts(res.data);
    }
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentActive: boolean) => {
    const res = await toggleProductStatus(id, currentActive);
    if (res.success) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight">Управление каталогом</h2>
          <p className="text-mute text-[13px] mt-1">Витрина товаров для Bazzar Certs. *Находится в стадии разработки (заглушка).*</p>
        </div>
        
        <button 
          className="flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-accent/80 text-white text-[13px] font-medium rounded-xl transition-all"
          onClick={() => alert('Создание товара пока недоступно')}
        >
          <Plus className="w-4 h-4" />
          Добавить товар
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Всего товаров
          </div>
          <div className="text-[28px] font-bold text-foreground">
            {products.length}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Активные
          </div>
          <div className="text-[28px] font-bold text-ok">
            {products.filter(p => p.active).length}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-white/[0.01] text-mute border-b border-line text-[11px] uppercase tracking-[0.05em]">
            <tr>
              <th className="py-3 px-4 font-semibold">Название</th>
              <th className="py-3 px-4 font-semibold">Цена</th>
              <th className="py-3 px-4 font-semibold">Наличие</th>
              <th className="py-3 px-4 font-semibold">Статус</th>
              <th className="py-3 px-3 font-semibold text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-mute mx-auto" /></td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.015] transition-colors">
                <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt="product" className="w-full h-full object-cover" />
                    ) : (
                      <PackageSearch size={14} className="text-mute" />
                    )}
                  </div>
                  {p.title}
                </td>
                <td className="py-3 px-4 font-mono font-bold">{p.price.toLocaleString('ru-RU')} ₽</td>
                <td className="py-3 px-4 text-mute">{p.stock > 0 ? `${p.stock} шт.` : 'Нет в наличии'}</td>
                <td className="py-3 px-4">
                  <button onClick={() => toggleStatus(p.id, p.active)} className="flex items-center gap-2">
                    {p.active ? <ToggleRight className="text-ok" size={20} /> : <ToggleLeft className="text-mute" size={20} />}
                    <span className={p.active ? 'text-ok font-medium' : 'text-mute'}>{p.active ? 'Активен' : 'Скрыт'}</span>
                  </button>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-mute hover:text-foreground rounded-md transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button className="p-1.5 text-mute hover:text-err rounded-md transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
