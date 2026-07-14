/**
 * components/finance/FinancesClient.tsx — Financial overview page.
 *
 * Shows company-wide income, expenses and net balance with a full
 * filterable transaction table.
 *
 * Sub-components:
 *  - AddTransactionModal  — form to add a new income or expense record.
 *    Exported so ProjectDetail can reuse it for project-scoped transactions.
 *
 * Data flow:
 *  - initialTransactions + projects are server-fetched and passed as props.
 *  - New transactions are prepended to local state (no reload).
 *  - Deletes are optimistic with rollback on error.
 */

'use client'

import { useMemo, useState } from 'react'
import {
  Plus, Trash2, Loader2, TrendingUp, TrendingDown, Scale, Filter, Search, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { fmtRub, timeAgo } from '@/lib/utils'

// ─── types ────────────────────────────────────────────────────────────────────

export type TxRow = {
  id: string
  project_id: string | null
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  created_by: string | null
  project: { id: string; name: string; color: string } | null
}

type ProjectOption = { id: string; name: string; color: string }

// ─── constants ────────────────────────────────────────────────────────────────

export const TX_CATEGORIES: Record<string, { label: string; color: string }> = {
  revenue:        { label: 'Выручка',          color: '#22C55E' },
  client_payment: { label: 'Оплата клиента',   color: '#22C55E' },
  salary:         { label: 'Зарплата',         color: '#EF4444' },
  marketing:      { label: 'Маркетинг',        color: '#F59E0B' },
  development:    { label: 'Разработка',       color: '#6F4FE8' },
  infrastructure: { label: 'Инфраструктура',   color: '#00C2FF' },
  other:          { label: 'Прочее',           color: '#8B92B4' },
}

const FIELD  = 'w-full h-10 px-3.5 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const SELECT = 'w-full h-10 px-3 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13px] transition-all'
const LABEL  = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

// ─── AddTransactionModal (exported for ProjectDetail) ────────────────────────

export function AddTransactionModal({
  projects,
  initialProjectId,
  onClose,
  onAdded,
}: {
  projects: ProjectOption[]
  initialProjectId?: string
  onClose: () => void
  onAdded: (t: TxRow) => void
}) {
  const supabase = createClient()
  const { user } = useAuthStore()

  const [txType,      setTxType]      = useState<'income' | 'expense'>('income')
  const [amount,      setAmount]      = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('other')
  const [projectId,   setProjectId]   = useState(initialProjectId ?? '')
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10))
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const save = async () => {
    if (!description.trim()) { setError('Укажите описание'); return }
    const amt = parseFloat(amount.replace(/\s/g, '').replace(',', '.'))
    if (!amt || amt <= 0) { setError('Введите корректную сумму'); return }
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('transactions')
      .insert({
        project_id:  projectId || null,
        type:        txType,
        amount:      amt,
        description: description.trim(),
        category,
        date,
        created_by:  user?.id ?? null,
      })
      .select('*, project:projects(id, name, color)')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onAdded(data as TxRow)
    onClose()
  }

  return (
    <Modal
      title="Новая транзакция"
      onClose={onClose}
      maxWidth="max-w-[460px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 size={15} className="animate-spin" />} Добавить
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-bg border border-line">
          {(['income', 'expense'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTxType(t)}
              className={`h-9 rounded-lg text-[13px] font-semibold transition-all ${
                txType === t
                  ? t === 'income' ? 'bg-ok/20 text-ok border border-ok/30' : 'bg-err/20 text-err border border-err/30'
                  : 'text-mute hover:text-slate-800'
              }`}>
              {t === 'income' ? '↑ Доход' : '↓ Расход'}
            </button>
          ))}
        </div>

        <div>
          <label className={LABEL}>Сумма, ₽ *</label>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="0"
            inputMode="decimal"
            className={FIELD}
            autoFocus
          />
        </div>

        <div>
          <label className={LABEL}>Описание *</label>
          <input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Оплата услуг, зарплата…" className={FIELD} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Категория</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={SELECT}>
              {Object.entries(TX_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Дата</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={SELECT} />
          </div>
        </div>

        {projects.length > 0 && (
          <div>
            <label className={LABEL}>Проект</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              disabled={!!initialProjectId}
              className={SELECT}
            >
              <option value="">Без проекта (общий)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  )
}

// ─── FinancesClient ───────────────────────────────────────────────────────────

interface Props {
  initialTransactions: TxRow[]
  projects: ProjectOption[]
}

const PAGE = 50

export function FinancesClient({ initialTransactions, projects }: Props) {
  const supabase   = createClient()
  const { user }   = useAuthStore()
  const addToast   = useUIStore(s => s.addToast)
  const isCeoOrCoowner = user?.role === 'ceo' || user?.role === 'coowner'

  const [txList,        setTxList]        = useState<TxRow[]>(initialTransactions)
  const [filterType,    setFilterType]    = useState<'all' | 'income' | 'expense'>('all')
  const [filterProject, setFilterProject] = useState('')
  const [search,        setSearch]        = useState('')
  const [showAdd,       setShowAdd]       = useState(false)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [page,          setPage]          = useState(0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return txList.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterProject && t.project_id !== filterProject) return false
      if (q && !t.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [txList, filterType, filterProject, search])

  // Single pass — avoids 2 separate filter+reduce chains
  const totals = useMemo(() => {
    let income = 0, expense = 0
    for (const t of filtered) {
      if (t.type === 'income') income += Number(t.amount)
      else expense += Number(t.amount)
    }
    return { income, expense, net: income - expense }
  }, [filtered])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE))
  const pageRows    = filtered.slice(page * PAGE, (page + 1) * PAGE)

  const deleteTx = async (id: string) => {
    setConfirmDelete(null)
    setDeletingId(id)
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    setDeletingId(null)
    if (error) { addToast('Ошибка', 'Не удалось удалить транзакцию', 'err'); return }
    setTxList(prev => prev.filter(t => t.id !== id))
  }

  const canDelete = (t: TxRow) => isCeoOrCoowner || t.created_by === user?.id

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-ok/15 text-ok flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="text-[12.5px] text-mute font-medium">Доходы</span>
          </div>
          <div className="text-[28px] font-bold tabular-nums text-ok">{fmtRub(totals.income)}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-err/15 text-err flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
            <span className="text-[12.5px] text-mute font-medium">Расходы</span>
          </div>
          <div className="text-[28px] font-bold tabular-nums text-err">{fmtRub(totals.expense)}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totals.net >= 0 ? 'bg-ok/15 text-ok' : 'bg-err/15 text-err'}`}>
              <Scale size={18} />
            </div>
            <span className="text-[12.5px] text-mute font-medium">Прибыль / убыток</span>
          </div>
          <div className={`text-[28px] font-bold tabular-nums ${totals.net >= 0 ? 'text-ok' : 'text-err'}`}>
            {totals.net >= 0 ? '+' : ''}{fmtRub(totals.net)}
          </div>
        </div>
        
        {/* GGSel Widget */}
        <div className="card p-5 border border-[#FF9900]/20 relative overflow-hidden transition-all hover:border-[#FF9900]/40">
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(255,153,0,0.1), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-[#FF9900]/15 text-[#FF9900] flex items-center justify-center font-bold tracking-tighter">
              GG
            </div>
            <div className="flex flex-col">
              <span className="text-[12.5px] text-[#FF9900] font-bold">Баланс GGSel</span>
              <span className="text-[10px] text-mute uppercase tracking-widest">К выводу</span>
            </div>
          </div>
          <div className="text-[28px] font-bold tabular-nums text-slate-800 relative z-10">
            14 550 <span className="text-[18px] text-mute font-medium">₽</span>
          </div>
          <div className="text-[11.5px] text-mute mt-2 pt-2 border-t border-line flex justify-between items-center relative z-10">
            <span>В холде: <span className="text-slate-800 font-medium">4 200 ₽</span></span>
            <button className="text-[#FF9900] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer">
              Вывести
            </button>
          </div>
        </div>
      </div>

      {/* Filters + Add button */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-mute2 shrink-0"><Filter size={14} /></div>
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value as typeof filterType); setPage(0) }}
          className="h-9 px-3 rounded-lg border border-line bg-bg text-[12.5px] text-mute hover:text-slate-800 transition-all outline-none"
        >
          <option value="all">Все типы</option>
          <option value="income">Доходы</option>
          <option value="expense">Расходы</option>
        </select>
        <select
          value={filterProject}
          onChange={e => { setFilterProject(e.target.value); setPage(0) }}
          className="h-9 px-3 rounded-lg border border-line bg-bg text-[12.5px] text-mute hover:text-slate-800 transition-all outline-none"
        >
          <option value="">Все проекты</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute2 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Поиск по описанию…"
            className="w-full h-9 pl-8 pr-7 rounded-lg border border-line bg-bg text-[12.5px] text-slate-800 placeholder:text-mute2 outline-none focus:border-accent/60 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(0) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute2 hover:text-slate-800">
              <X size={12} />
            </button>
          )}
        </div>
        <Button onClick={() => setShowAdd(true)} className="shrink-0"><Plus size={15} /> Добавить</Button>
      </div>

      {/* Transactions table */}
      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            emoji={txList.length === 0 ? '💰' : '🔍'}
            title={txList.length === 0 ? 'Транзакций пока нет' : 'Ничего не найдено'}
            description={txList.length === 0 ? 'Добавьте первую транзакцию — доход или расход.' : 'Попробуйте изменить фильтры.'}
          />
        ) : (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-mute2">
                <th className="text-left px-5 py-3 font-semibold">Дата</th>
                <th className="text-left px-5 py-3 font-semibold">Описание</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Категория</th>
                <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Проект</th>
                <th className="text-left px-5 py-3 font-semibold">Тип</th>
                <th className="text-right px-5 py-3 font-semibold">Сумма</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map(t => {
                const cat = TX_CATEGORIES[t.category] ?? TX_CATEGORIES.other
                return (
                  <tr key={t.id} className="border-b border-line last:border-0 hover:bg-black/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-[12.5px] text-mute font-mono whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium max-w-[240px] truncate">
                      {t.description}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2 h-5 rounded-full"
                        style={{ background: `${cat.color}20`, color: cat.color }}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-mute hidden lg:table-cell">
                      {t.project ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: t.project.color }} />
                          {t.project.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Tag tone={t.type === 'income' ? 'ok' : 'mute'}>
                        {t.type === 'income' ? '↑ Доход' : '↓ Расход'}
                      </Tag>
                    </td>
                    <td className={`px-5 py-3.5 text-right text-[13.5px] font-bold tabular-nums font-mono ${
                      t.type === 'income' ? 'text-ok' : 'text-err'
                    }`}>
                      {t.type === 'income' ? '+' : '−'}{fmtRub(Number(t.amount))}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      {canDelete(t) && (
                        deletingId === t.id ? (
                          <Loader2 size={13} className="animate-spin text-mute" />
                        ) : confirmDelete === t.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => deleteTx(t.id)}
                              className="text-[11px] text-err font-semibold px-1.5 h-6 rounded hover:bg-err/10 transition-colors"
                            >
                              Удалить
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-[11px] text-mute px-1.5 h-6 rounded hover:text-slate-800 transition-colors"
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(t.id)}
                            aria-label="Удалить"
                            className="w-7 h-7 rounded-lg text-mute hover:text-err transition-all inline-flex items-center justify-center"
                          >
                            <Trash2 size={13} />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-line">
            <span className="text-[12px] text-mute">
              {page * PAGE + 1}–{Math.min((page + 1) * PAGE, filtered.length)} из {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-7 h-7 rounded-lg border border-line text-mute hover:text-slate-800 hover:border-line2 inline-flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              {totalPages <= 7
                ? Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      className={`w-7 h-7 rounded-lg text-[12px] font-semibold transition-all ${
                        i === page ? 'bg-brand text-[#171821]' : 'border border-line text-mute hover:text-slate-800'
                      }`}>
                      {i + 1}
                    </button>
                  ))
                : <span className="px-2 text-[12px] text-mute tabular-nums">стр. {page + 1} / {totalPages}</span>
              }
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-7 h-7 rounded-lg border border-line text-mute hover:text-slate-800 hover:border-line2 inline-flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddTransactionModal
          projects={projects}
          onClose={() => setShowAdd(false)}
          onAdded={t => setTxList(prev => [t, ...prev])}
        />
      )}
    </>
  )
}
