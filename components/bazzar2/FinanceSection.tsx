import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import type { Cert } from '@/lib/bazzar2/load'
import { KpiTile, money, num } from './kit'

interface Tx {
  id: string
  type: string
  amount: number
  description: string
  category: string
  date: string
}

export function FinanceSection({ certs, tx }: { certs: Cert[]; tx: Tx[] }) {
  const revenue = certs.reduce((s, c) => s + (c.sale_price || 0), 0)
  const cost = certs.reduce((s, c) => s + (c.api_cost || 0), 0)
  const gross = revenue - cost

  const income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const expense = tx.filter((t) => t.type !== 'income').reduce((s, t) => s + (t.amount || 0), 0)

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Финансы · P&L</h1>
        <span className="text-[13px] text-mute">за 90 дней</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Выручка (серты)" value={money(revenue)} sub={`${num(certs.length)} продаж`} accent="#1472F5" icon={<Wallet size={18} />} />
        <KpiTile label="Себестоимость" value={money(cost)} accent="#F59E0B" icon={<TrendingDown size={18} />} />
        <KpiTile label="Валовая прибыль" value={money(gross)} sub={revenue ? `маржа ${Math.round((gross / revenue) * 100)}%` : undefined} accent="#22C55E" icon={<TrendingUp size={18} />} />
        <KpiTile label="Проведено в кассе" value={money(income)} sub={expense ? `расходы ${money(expense)}` : 'из транзакций'} />
      </div>

      <div className="card">
        <div className="p-4 border-b border-black/[0.05] text-[14px] font-bold">Движения по кассе (bazzar)</div>
        <div className="divide-y divide-black/[0.05]">
          {tx.length === 0 && <div className="p-10 text-center text-mute">Нет транзакций.</div>}
          {tx.map((t) => {
            const isIncome = t.type === 'income'
            return (
              <div key={t.id} className="p-3.5 flex items-center gap-4 text-[13px]">
                <span className={`shrink-0 w-2 h-2 rounded-full ${isIncome ? 'bg-ok' : 'bg-err'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.description}</div>
                  <div className="text-[11px] text-mute">{t.category} · {new Date(t.date).toLocaleDateString('ru-RU')}</div>
                </div>
                <span className={`shrink-0 font-semibold tabular-nums ${isIncome ? 'text-ok' : 'text-err'}`}>
                  {isIncome ? '+' : '−'}{money(t.amount)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-[12px] text-mute">
        P&amp;L по выручке/себестоимости считается из <code>apple_certificates</code>. Комиссия эквайринга и прочие расходы — из <code>transactions</code>.
      </div>
    </div>
  )
}
