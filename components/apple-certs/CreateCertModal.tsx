'use client';

import { useState } from 'react';
import { X, Apple, Smartphone, DollarSign, Activity } from 'lucide-react';
import { registerCertificate } from '@/app/actions/apple-certs';

interface CreateCertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCertModal({ isOpen, onClose, onSuccess }: CreateCertModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const plan_id = formData.get('plan_id') as string;
    
    // Mapping plan to its approx api_cost for statistics (hardcoded based on info, could be improved)
    const costMapping: Record<string, number> = {
      'super0': 1.0,
      'super180': 1.5,
      'super360': 3.0,
      'super90': 5.0,
      'super_ipad': 6.0,
      'super_ipad2': 10.0,
      'developer_plan': 5.0,
      'plan_superPPQ1': 1.0
    };

    const data = {
      udid: formData.get('udid') as string,
      plan_id: plan_id,
      api_cost: costMapping[plan_id] || 0,
      sale_price: parseFloat(formData.get('sale_price') as string) || 0,
      source: formData.get('source') as string,
    };

    try {
      const res = await registerCertificate(data);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Failed to register certificate');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-line rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-mute hover:text-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Apple className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Учет проданного сертификата</h2>
            <p className="text-sm text-mute">Внимание: сертификат не регистрируется автоматически! Вам нужно создать его вручную у поставщика, а здесь просто зафиксировать продажу.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-mute mb-1">UDID Устройства</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute2" />
              <input 
                name="udid"
                required
                placeholder="00008110-001A2B3C..."
                className="w-full bg-bg border border-line rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-mute mb-1">Тариф (Plan ID)</label>
            <div className="relative">
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute2" />
              <select 
                name="plan_id"
                required
                className="w-full bg-bg border border-line rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-accent/60 transition-colors appearance-none"
              >
                <option value="super0">Super | iOS 0M Protection ($1.0)</option>
                <option value="super40">Super | iOS 1M Protection ($1.5)</option>
                <option value="super90">Super | iOS 3M Protection ($3.0)</option>
                <option value="super180">Super | iOS 6M Protection ($5.0)</option>
                <option value="super360">Super | iOS ∞ Protection ($10.0)</option>
                <option value="super_ipad">Super | iPad 0M ($1.0)</option>
                <option value="super_ipad2">Super | iPad 10M ($3.0)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-mute mb-1">Цена продажи (₽)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute2" />
                <input 
                  type="number"
                  name="sale_price"
                  required
                  placeholder="300"
                  className="w-full bg-bg border border-line rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-accent/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-mute mb-1">Источник</label>
              <select 
                name="source"
                required
                className="w-full bg-bg border border-line rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:border-accent/60 transition-colors"
              >
                <option value="avito">Авито</option>
                <option value="ggsel">GGSEL</option>
                <option value="plati">Plati Market</option>
                <option value="site">Сайт Bazzar</option>
                <option value="bot">Telegram Бот</option>
                <option value="manual">Ручная продажа (ЛС)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-3 bg-bg border border-line rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-xs uppercase">
              АК
            </div>
            <div className="flex-1 text-sm">
              <div className="text-mute">Согласующий</div>
              <div className="text-slate-800 font-medium">Артём Кошелев</div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-brand hover:bg-brand/90 text-[#171821] font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Сохранить в историю'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
