'use client'

import { useState, useMemo } from 'react'
import { Calendar, CreditCard, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { getInitials, colorFor } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

interface PixelTransactionsProps {
  initialTransactions: any[]
}

export function PixelTransactions({ initialTransactions }: PixelTransactionsProps) {
  const [txs] = useState<any[]>(initialTransactions)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTxs = useMemo(() => {
    return txs.filter(t => {
      // Apply type filter
      if (filterType !== 'all') {
        if (filterType === 'deposit' && t.type !== 'deposit' && !t.type.includes('stars') && !t.type.includes('payment')) {
          return false
        }
        if (filterType === 'charge' && t.type !== 'charge' && !t.type.includes('spend') && !t.type.includes('cost')) {
          return false
        }
        if (filterType === 'refund' && t.type !== 'refund') {
          return false
        }
      }

      // Apply search query
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const username = t.user?.username || ''
      const firstName = t.user?.first_name || ''
      const desc = t.description || ''
      return (
        username.toLowerCase().includes(q) ||
        firstName.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      )
    })
  }, [txs, filterType, searchQuery])

  const totals = useMemo(() => {
    let deposit = 0
    let charge = 0
    let refund = 0
    for (const t of txs) {
      const amt = Math.abs(Number(t.amount || 0))
      if (t.type === 'deposit' || t.type.includes('stars') || t.type.includes('payment') || t.amount > 0) {
        deposit += amt
      } else if (t.type === 'refund') {
        refund += amt
      } else {
        charge += amt
      }
    }
    return { deposit, charge, refund }
  }, [txs])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-[16px] font-semibold">История платежей и транзакций</h3>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-line bg-bg text-[12.5px] text-mute hover:text-slate-800 transition-all outline-none"
          >
            <option value="all">Все транзакции</option>
            <option value="deposit">Пополнения</option>
            <option value="charge">Списания</option>
            <option value="refund">Возвраты</option>
          </select>
          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по описанию/пользователю..."
              className="h-8 pl-8 pr-3 rounded-lg border border-line bg-bg/50 text-[12px] outline-none w-52 focus:border-accent/60 transition-all"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-mute2" />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-bg border border-line p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-mute2 uppercase tracking-[0.05em] font-semibold mb-1">Всего зачислено</div>
            <div className="text-[17px] font-black text-ok font-mono">+{totals.deposit} ⚡</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-ok/10 flex items-center justify-center text-ok">
            <ArrowUpRight size={16} />
          </div>
        </div>
        <div className="rounded-xl bg-bg border border-line p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-mute2 uppercase tracking-[0.05em] font-semibold mb-1">Всего списано</div>
            <div className="text-[17px] font-black text-err font-mono">-{totals.charge} ⚡</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-err/10 flex items-center justify-center text-err">
            <ArrowDownLeft size={16} />
          </div>
        </div>
        <div className="rounded-xl bg-bg border border-line p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-mute2 uppercase tracking-[0.05em] font-semibold mb-1">Всего возвращено</div>
            <div className="text-[17px] font-black text-accent font-mono">+{totals.refund} ⚡</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <ArrowUpRight size={16} />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-line text-mute2 uppercase tracking-wider text-[11px] font-bold">
              <th className="pb-3 pr-4">Пользователь</th>
              <th className="pb-3 px-4">Сумма</th>
              <th className="pb-3 px-4">Назначение / Описание</th>
              <th className="pb-3 px-4">Тип</th>
              <th className="pb-3 pl-4 text-right">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/30">
            {filteredTxs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={CreditCard} title="Транзакций не найдено" description="История платежей и пополнений появится здесь." />
                </td>
              </tr>
            ) : (
              filteredTxs.map(t => {
                const isDeposit = t.type === 'deposit' || t.type.includes('stars') || t.type.includes('payment') || t.amount > 0
                const isRefund = t.type === 'refund'
                const amountVal = Math.abs(Number(t.amount || 0))
                
                return (
                  <tr key={t.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="py-3 pr-4 font-semibold flex items-center gap-2">
                      <Avatar
                        initials={getInitials(t.user?.first_name || t.user?.username || 'User')}
                        color={colorFor(t.user?.username || t.user?.first_name || t.user_id)}
                        size={24}
                        src={t.user?.avatar_url}
                      />
                      <span className="truncate">
                        {t.user?.first_name || 'Пользователь'}
                        {t.user?.username && <span className="text-[11px] text-mute2 font-normal ml-1">@{t.user.username}</span>}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-bold font-mono ${isDeposit ? 'text-ok' : isRefund ? 'text-accent' : 'text-err'}`}>
                      {isDeposit ? '+' : isRefund ? '+' : '-'}{amountVal} ⚡
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-[250px] truncate" title={t.description}>
                      {t.description || 'Без описания'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isDeposit 
                          ? 'bg-ok/5 text-ok border-ok/20' 
                          : isRefund 
                            ? 'bg-accent/5 text-accent border-accent/20' 
                            : 'bg-err/5 text-err border-err/20'
                      }`}>
                        {isDeposit ? 'Пополнение' : isRefund ? 'Возврат' : 'Списание'}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right text-mute2 font-mono text-[11.5px]">
                      {new Date(t.created_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
