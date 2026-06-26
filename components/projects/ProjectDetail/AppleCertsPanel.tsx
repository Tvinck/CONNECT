'use client';

import { useState, useEffect } from 'react';
import { Apple, Wallet, History, Plus, RefreshCw, Smartphone, TrendingUp, CheckCircle2, XCircle, Search, MessageSquareText, Trash2 } from 'lucide-react';
import { checkBalance, getCertificates, updateCertStatus, deleteCertificate } from '@/app/actions/apple-certs';
import CreateCertModal from '@/components/apple-certs/CreateCertModal';
import { useAuthStore } from '@/store/auth';

const ARTEM_ID = '99fc4e1a-e44c-40e1-b2ef-cddb6ec94bf6';

export function AppleCertsPanel() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balanceRes, certsRes] = await Promise.all([
        checkBalance(),
        getCertificates()
      ]);

      if (balanceRes.success) {
        if (balanceRes.isManualMode) {
          setIsManualMode(true);
        } else {
          setBalance(balanceRes.balance || 0);
        }
      }
      
      if (certsRes.success && certsRes.data) {
        setCertificates(certsRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRevenue = certificates.reduce((acc, curr) => acc + (Number(curr.sale_price) || 0), 0);
  const totalCost = certificates.reduce((acc, curr) => acc + (Number(curr.api_cost) || 0), 0);
  const estProfitUsd = (totalRevenue / 90) - totalCost;

  const filteredCerts = certificates.filter(c => 
    c.udid.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.plan_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (certId: string, newStatus: string) => {
    if (user?.id !== ARTEM_ID) return;
    
    let comment = '';
    if (newStatus === 'approved') {
      const input = window.prompt('Введите инструкцию или комментарий для клиента (опционально):');
      if (input === null) return;
      comment = input;
    }

    setUpdatingId(certId);
    try {
      const res = await updateCertStatus(certId, newStatus, comment);
      if (res.success) {
        loadData();
      } else {
        alert('Ошибка при обновлении: ' + res.error);
      }
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (certId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    try {
      const res = await deleteCertificate(certId);
      if (res.success) {
        loadData();
      } else {
        alert('Ошибка при удалении: ' + res.error);
      }
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const getCrmStatusBadge = (cert: any) => {
    const isArtem = user?.id === ARTEM_ID;
    const isUpdating = updatingId === cert.id;
    
    let badgeClass = '';
    let label = '';
    
    if (cert.crm_status === 'pending') {
      badgeClass = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      label = 'На рассмотрении';
    } else if (cert.crm_status === 'in_progress') {
      badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      label = 'В работе';
    } else if (cert.crm_status === 'approved') {
      badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      label = 'Согласовано';
    } else {
      badgeClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
      label = cert.crm_status;
    }

    if (!isArtem) {
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
          {label}
        </span>
      );
    }

    return (
      <select 
        value={cert.crm_status}
        disabled={isUpdating}
        onChange={(e) => handleStatusChange(cert.id, e.target.value)}
        className={`appearance-none cursor-pointer outline-none inline-flex items-center px-2.5 py-1 pr-6 rounded-full text-xs font-medium border transition-colors ${badgeClass} ${isUpdating ? 'opacity-50' : 'hover:opacity-80'}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.25rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.25em 1.25em'
        }}
      >
        <option value="pending" className="bg-zinc-900 text-zinc-300">На рассмотрении</option>
        <option value="in_progress" className="bg-zinc-900 text-zinc-300">В работе</option>
        <option value="approved" className="bg-zinc-900 text-zinc-300">Согласовано</option>
      </select>
    );
  };

  const displayBalance = isManualMode ? (100 - totalCost).toFixed(2) : (balance !== null ? balance.toFixed(2) : '...');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight">Регистрация сертификатов</h2>
          <p className="text-mute text-[13px] mt-1">Автоматическая выдача отключена. Сертификаты выдаются вручную после согласования.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => loadData()}
            className="p-2.5 bg-black/[0.04] dark:bg-white/[0.04] border border-line text-mute hover:text-foreground rounded-xl transition-all"
            title="Обновить данные"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-accent/80 text-white text-[13px] font-medium rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Регистрация
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Баланс {isManualMode ? '(Локальный)' : 'API'}
          </div>
          <div className="text-[28px] font-bold text-foreground relative">
            ${displayBalance}
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <History className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Выдано
          </div>
          <div className="text-[28px] font-bold text-foreground relative">
            {certificates.length}
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Прибыль
          </div>
          <div className="text-[28px] font-bold text-foreground relative">
            ~${estProfitUsd.toFixed(1)}
          </div>
          <p className="text-[11px] text-mute mt-1 relative">Оборот: {totalRevenue} ₽</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold tracking-tight">История регистраций</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mute" />
            <input 
              type="text" 
              placeholder="Поиск по UDID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-line rounded-lg py-1.5 pl-9 pr-3 text-[12.5px] text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-black/[0.02] dark:bg-white/[0.01] text-mute border-b border-line text-[11px] uppercase tracking-[0.05em]">
              <tr>
                <th className="py-3 px-4 font-semibold">UDID & Тариф</th>
                <th className="py-3 px-4 font-semibold">Финансы</th>
                <th className="py-3 px-4 font-semibold">Статус (API)</th>
                <th className="py-3 px-4 font-semibold">Статус (CRM)</th>
                <th className="py-3 px-4 font-semibold text-right">Дата</th>
                <th className="py-3 px-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-mute">Загрузка данных...</td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-mute">Ничего не найдено</td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.015] transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-mono text-foreground text-[12px]">
                          <Smartphone className="w-3 h-3 text-mute" />
                          {cert.udid.substring(0, 15)}...
                        </div>
                        <div className="text-mute text-[10.5px] flex items-center gap-1.5">
                          <span>{cert.plan_id}</span>
                          <span className="px-1 py-0.5 rounded text-[9px] uppercase font-bold bg-white/[0.06] text-mute2">{cert.source}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{cert.sale_price} ₽</span>
                        <span className="text-mute2 text-[10.5px]">${cert.api_cost} (API)</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {cert.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-ok/10 text-ok border border-ok/20">
                          Активен
                        </span>
                      ) : cert.status === 'revoked' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-err/10 text-err border border-err/20">
                          Отозван
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-mute2/10 text-mute2 border border-mute2/20">
                          Истек
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {getCrmStatusBadge(cert)}
                        
                        {cert.approval_comment && (
                          <div className="flex items-start gap-1 mt-1 text-[10.5px] text-accent bg-accent/10 p-1.5 rounded-lg max-w-xs border border-accent/20">
                            <span className="leading-tight">{cert.approval_comment}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-mute text-[11.5px] whitespace-nowrap">
                      {new Date(cert.created_at).toLocaleDateString('ru-RU', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => handleDelete(cert.id)}
                        className="p-1.5 text-mute2 hover:text-err hover:bg-err/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCertModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => loadData()}
      />
    </div>
  );
}
