'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Smartphone, ShieldCheck, HelpCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { getBazzarUsers } from '@/app/actions/bazzar';

export function BazzarUsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res = await getBazzarUsers();
    if (res.success && res.data) {
      setUsers(res.data);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.udid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'bought':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-ok/10 text-ok border border-ok/20">
            <ShieldCheck size={12} /> Купил сертификат
          </span>
        );
      case 'thinking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-mute2/10 text-mute2 border border-mute2/20">
            <HelpCircle size={12} /> В раздумьях
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-accent/10 text-accent border border-accent/20">
            <Clock size={12} /> Ожидает выдачи
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight">Пользователи сайта</h2>
          <p className="text-mute text-[13px] mt-1">База всех посетителей, привязавших свое устройство (UDID).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Всего пользователей
          </div>
          <div className="text-[28px] font-bold text-foreground">
            {users.length}
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-ok" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Купили сертификат
          </div>
          <div className="text-[28px] font-bold text-ok">
            {users.filter(u => u.status === 'bought').length}
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <HelpCircle className="w-16 h-16 text-mute2" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Без покупок
          </div>
          <div className="text-[28px] font-bold text-foreground">
            {users.filter(u => u.status === 'thinking').length}
          </div>
          <p className="text-[11px] text-mute mt-1 relative">Конверсия в покупку: {users.length > 0 ? Math.round((users.filter(u => u.status === 'bought').length / users.length) * 100) : 0}%</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold tracking-tight">Список посетителей</h3>
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
                <th className="py-3 px-4 font-semibold">Пользователь (UDID)</th>
                <th className="py-3 px-4 font-semibold">Статус</th>
                <th className="py-3 px-4 font-semibold">Регистрация</th>
                <th className="py-3 px-4 font-semibold text-right">Последняя покупка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-mute mx-auto" /></td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.015] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-mono text-foreground font-medium text-[12px]">
                        <Smartphone className="w-3.5 h-3.5 text-mute" />
                        {user.udid}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="py-3 px-4 text-mute text-[12px]">
                    {new Date(user.created_at).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {user.last_purchase ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-foreground font-medium">{user.plan}</span>
                        <span className="text-mute text-[11px]">
                          {new Date(user.last_purchase).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-mute text-[12px] italic">Нет покупок</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-mute">Ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
