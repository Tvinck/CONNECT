'use client';

import { useState, useEffect } from 'react';
import { PackageSearch, Plus, Tag, ToggleLeft, ToggleRight, Edit2, Trash2, Loader2, X, Save } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { getBazzarProducts, toggleProductStatus, createBazzarProduct, updateBazzarProduct, deleteBazzarProduct } from '@/app/actions/bazzar';

export function BazzarProductsPanel() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '', subtitle: '', category: 'certs', emoji: '🛍️', grad: 'linear-gradient(135deg,#1b2838,#66c0f4)', 
    image: '', price: 0, old_price: 0, badge: '', delivery: 'Моментально', stock: 999, warranty: 'Без гарантии', ipa_url: ''
  });

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

  const handleDelete = async (id: string) => {
    if (!confirm('Точно удалить этот товар?')) return;
    const res = await deleteBazzarProduct(id);
    if (res.success) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      alert('Ошибка при удалении: ' + res.error);
    }
  };

  const openModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title || '', subtitle: product.subtitle || '', category: product.category || 'certs',
        emoji: product.emoji || '', grad: product.grad || '', image: product.image || '',
        price: product.price || 0, old_price: product.old_price || 0, badge: product.badge || '',
        delivery: product.delivery || '', stock: product.stock || 0, warranty: product.warranty || '', ipa_url: product.ipa_url || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: '', subtitle: '', category: 'apps', emoji: '📦', grad: 'linear-gradient(135deg,#1b2838,#66c0f4)', 
        image: '', price: 0, old_price: 0, badge: '', delivery: 'Моментально', stock: 999, warranty: 'Без гарантии', ipa_url: ''
      });
    }
    setModalOpen(true);
  };

  const saveProduct = async () => {
    if (!formData.title) return alert('Введите название');
    setSaving(true);
    
    // Prepare data
    const dataToSave = {
      ...formData,
      active: editingProduct ? editingProduct.active : true,
      price: Number(formData.price),
      old_price: Number(formData.old_price),
      stock: Number(formData.stock)
    };

    let res;
    if (editingProduct) {
      res = await updateBazzarProduct(editingProduct.id, dataToSave);
    } else {
      res = await createBazzarProduct(dataToSave);
    }

    setSaving(false);
    if (res.success) {
      setModalOpen(false);
      loadProducts();
    } else {
      alert('Ошибка: ' + res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight">Управление каталогом</h2>
          <p className="text-mute text-[13px] mt-1">Витрина товаров для Bazzar Certs. База данных подключена.</p>
        </div>
        
        <button 
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand hover:bg-brand/90 text-[#171821] text-[13px] font-medium rounded-xl transition-all"
          onClick={() => openModal()}
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

      <div className="card">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-bg text-mute border-b border-line text-[11px] uppercase tracking-[0.05em]">
            <tr>
              <th className="py-3 px-4 font-semibold">Название</th>
              <th className="py-3 px-4 font-semibold">Категория</th>
              <th className="py-3 px-4 font-semibold">Цена</th>
              <th className="py-3 px-4 font-semibold">Наличие</th>
              <th className="py-3 px-4 font-semibold">Статус</th>
              <th className="py-3 px-3 font-semibold text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-mute mx-auto" /></td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6}><EmptyState icon={PackageSearch} title="Товаров пока нет" description="Добавьте первый товар, чтобы он появился здесь." /></td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-black/[0.02] transition-colors">
                <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center overflow-hidden text-[16px]">
                    {p.image ? (
                      <img src={p.image} alt="product" className="w-full h-full object-cover" />
                    ) : (
                      p.emoji || <PackageSearch size={14} className="text-mute" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span>{p.title}</span>
                    <span className="text-mute text-[11px] font-normal">{p.subtitle}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded bg-black/[0.03] dark:bg-white/[0.03] text-mute text-[11px] uppercase tracking-wider">{p.category}</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold">{p.price > 0 ? `${p.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}</td>
                <td className="py-3 px-4 text-mute">{p.stock > 0 ? `${p.stock} шт.` : 'Нет в наличии'}</td>
                <td className="py-3 px-4">
                  <button onClick={() => toggleStatus(p.id, p.active)} className="flex items-center gap-2">
                    {p.active ? <ToggleRight className="text-ok" size={20} /> : <ToggleLeft className="text-mute" size={20} />}
                    <span className={p.active ? 'text-ok font-medium' : 'text-mute'}>{p.active ? 'Активен' : 'Скрыт'}</span>
                  </button>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openModal(p)} className="p-1.5 text-mute hover:text-foreground rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-mute hover:text-err rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg border border-line rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-line">
              <h3 className="font-bold text-[16px]">{editingProduct ? 'Редактировать товар' : 'Новый товар'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-mute hover:text-foreground"><X size={20} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Название</label>
                  <input type="text" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent" 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Подзаголовок</label>
                  <input type="text" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent" 
                    value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Цена (₽)</label>
                  <input type="number" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent font-mono" 
                    value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Старая цена (₽)</label>
                  <input type="number" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent font-mono" 
                    value={formData.old_price} onChange={e => setFormData({...formData, old_price: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Наличие (шт)</label>
                  <input type="number" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent font-mono" 
                    value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Категория</label>
                  <select className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="certs">Сертификаты</option>
                    <option value="apps">Приложения</option>
                    <option value="tools">Утилиты</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Эмодзи</label>
                  <input type="text" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent" 
                    value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Бейдж</label>
                  <select className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent"
                    value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})}>
                    <option value="">Нет</option>
                    <option value="hot">Хит</option>
                    <option value="new">Новинка</option>
                    <option value="sale">Скидка</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Гарантия</label>
                  <input type="text" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent" 
                    value={formData.warranty} onChange={e => setFormData({...formData, warranty: e.target.value})} placeholder="Например: 1 Год" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-mute uppercase tracking-wider">Выдача (скорость)</label>
                  <input type="text" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent" 
                    value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} placeholder="Например: Моментально" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-mute uppercase tracking-wider flex items-center justify-between">
                  <span>Ссылка на IPA файл</span>
                  <span className="text-[10px] text-accent lowercase normal-case">Если это приложение/утилита</span>
                </label>
                <input type="text" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent" 
                  value={formData.ipa_url} onChange={e => setFormData({...formData, ipa_url: e.target.value})} placeholder="https://..." />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-mute uppercase tracking-wider">URL Обложки (Картинка)</label>
                <input type="text" className="w-full bg-card border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent" 
                  value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="/img/file.png или https://..." />
              </div>

            </div>

            <div className="p-4 border-t border-line bg-card flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-mute hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">
                Отмена
              </button>
              <button onClick={saveProduct} disabled={saving} className="px-4 py-2 rounded-lg text-[13px] font-medium bg-brand text-[#171821] hover:bg-accent/90 transition-colors flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
