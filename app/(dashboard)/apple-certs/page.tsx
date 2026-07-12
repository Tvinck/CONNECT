'use client';

import { useState, useEffect } from 'react';
import { Apple, Wallet, History, Plus, RefreshCw, Smartphone, TrendingUp, CheckCircle2, XCircle, Search, MessageSquareText, Trash2 } from 'lucide-react';
import { checkBalance, getCertificates, updateCertStatus, deleteCertificate } from '@/app/actions/apple-certs';
import CreateCertModal from '@/components/apple-certs/CreateCertModal';
import { useAuthStore } from '@/store/auth';

const ARTEM_ID = '99fc4e1a-e44c-40e1-b2ef-cddb6ec94bf6';

export default function AppleCertsPage() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  
  // For status updates
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
  const estProfitUsd = (totalRevenue / 90) - totalCost; // Very rough estimation using 90 RUB/USD

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
      if (input === null) return; // cancelled
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
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Apple className="w-8 h-8" />
            </div>
            Apple Certificates
          </h1>
          <p className="text-zinc-400 mt-2">Учет продаж сертификатов iOS. Автоматическая выдача отключена. Сертификаты выдаются вручную после согласования заявки.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadData()}
            className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-xl transition-all"
            title="Обновить данные"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            Добавить продажу (CRM)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 text-zinc-400 font-medium mb-4 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Wallet className="w-4 h-4" />
            </div>
            Баланс {isManualMode ? '(Локальный)' : 'api.bot1.org'}
          </div>
          <div className="text-4xl font-bold text-white relative">
            ${displayBalance}
          </div>
          <p className="text-sm text-emerald-500 mt-2 font-medium flex items-center gap-1 relative">
            <CheckCircle2 className="w-4 h-4" /> {isManualMode ? 'CRM Режим' : 'API Доступно'}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <History className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 text-zinc-400 font-medium mb-4 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <History className="w-4 h-4" />
            </div>
            Всего выдано
          </div>
          <div className="text-4xl font-bold text-white relative">
            {certificates.length}
          </div>
          <p className="text-sm text-zinc-500 mt-2 relative">Активных сертификатов</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 text-zinc-400 font-medium mb-4 relative">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            Ориентировочная прибыль
          </div>
          <div className="text-4xl font-bold text-white relative">
            ~${estProfitUsd.toFixed(1)}
          </div>
          <p className="text-sm text-zinc-500 mt-2 relative">За всё время (Оборот: {totalRevenue} ₽)</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white">История продаж</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Поиск по UDID или источнику..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-4 px-6 font-medium">UDID & Тариф</th>
                <th className="py-4 px-6 font-medium">Опт / Розница</th>
                <th className="py-4 px-6 font-medium">Статус (API)</th>
                <th className="py-4 px-6 font-medium">Статус (CRM)</th>
                <th className="py-4 px-6 font-medium text-right">Дата</th>
                <th className="py-4 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">Загрузка данных...</td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">Ничего не найдено</td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-mono text-zinc-300 text-xs">
                          <Smartphone className="w-4 h-4 text-zinc-600 shrink-0" />
                          <span className="break-all" title={cert.udid}>{cert.udid}</span>
                        </div>
                        <div className="text-zinc-500 text-xs flex items-center gap-2">
                          <span>{cert.plan_id}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-400">{cert.source}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-zinc-300 font-medium">{cert.sale_price} ₽</span>
                        <span className="text-zinc-500 text-xs">${cert.api_cost} (API)</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {cert.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Активен
                        </span>
                      ) : cert.status === 'revoked' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Отозван
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-zinc-500/10 text-zinc-400">
                          Истек
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2 items-start">
                        {getCrmStatusBadge(cert)}
                        
                        {cert.approval_comment && (
                          <div className="flex items-start gap-1.5 mt-1 text-xs text-blue-400 bg-blue-500/10 p-2 rounded-lg max-w-xs">
                            <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span className="leading-tight">{cert.approval_comment}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-zinc-500 text-sm whitespace-nowrap">
                      {new Date(cert.created_at).toLocaleDateString('ru-RU', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleDelete(cert.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Удалить запись"
                      >
                        <Trash2 className="w-4 h-4" />
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
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
