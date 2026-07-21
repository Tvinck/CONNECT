'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Search, Download, Plus, Copy, Upload, FileUp, Lock } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { createClient } from '@/lib/supabase/client'
import { updateCertStatus } from '@/app/actions/apple-certs'
import type { Cert, ManualReg } from '@/lib/bazzar2/load'
import { channelMeta, money, dateTime } from './kit'
import { exportCsv } from '@/lib/bazzar2/csv'
import { AVITO_TARIFFS } from '@/lib/avitoTariffs'

const ARTEM_ID = '99fc4e1a-e44c-40e1-b2ef-cddb6ec94bf6'
const SITE = 'https://bazzar-serts.shop'
function genCode(): string {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let c = ''
  const b = new Uint8Array(9)
  crypto.getRandomValues(b)
  for (let i = 0; i < b.length; i++) c += a[b[i] % a.length]
  return c
}

const CERT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ожидает', color: '#F59E0B' },
  in_progress: { label: 'В работе', color: '#1472F5' },
  approved: { label: 'Согласован', color: '#22C55E' },
  rejected: { label: 'Отклонён', color: '#EF4444' },
}

const MANUAL_STATUS: Record<string, { label: string; color: string }> = {
  thinking: { label: 'Думает', color: '#F59E0B' },
  awaiting_payment: { label: 'Ждёт оплату', color: '#1472F5' },
  paid: { label: 'Оплачено', color: '#22C55E' },
  refused: { label: 'Отказался', color: '#EF4444' },
}

type Tab = 'queue' | 'manual' | 'all'

export function RegistrationsSection({ certs, manual }: { certs: Cert[]; manual: ManualReg[] }) {
  const [tab, setTab] = useState<Tab>('queue')
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [cPlatform, setCPlatform] = useState('avito')
  const [cMonths, setCMonths] = useState(AVITO_TARIFFS[0].guaranteeMonths)
  const [cExtra, setCExtra] = useState('')
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const router = useRouter()
  const { addToast } = useUIStore()

  const createReg = () => {
    const tariff = AVITO_TARIFFS.find((t) => t.guaranteeMonths === cMonths)
    if (!tariff) return
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        let name = 'Оператор'
        if (user) {
          const { data: p } = await supabase.from('users').select('full_name').eq('id', user.id).maybeSingle()
          name = p?.full_name || user.email?.split('@')[0] || 'Оператор'
        }
        const code = genCode()
        const { error } = await supabase.from('manual_registrations').insert({
          code, created_by: user?.id ?? null, created_by_name: name,
          platform: cPlatform, guarantee_months: tariff.guaranteeMonths, price: tariff.price,
          extra_info: cExtra.trim() || null, approver_id: ARTEM_ID, status: 'thinking',
        })
        if (error) throw error
        const link = `${SITE}/r/${code}`
        setCreatedLink(link)
        navigator.clipboard?.writeText(link).catch(() => {})
        addToast('Заявка создана, ссылка скопирована', undefined, 'ok')
        setCExtra('')
        router.refresh()
      } catch (e: any) {
        addToast('Ошибка', e.message || '', 'err')
      }
    })
  }

  const s = search.trim().toLowerCase()
  const matchCert = (c: Cert) => !s || (c.plan_id || '').toLowerCase().includes(s) || (c.udid || '').toLowerCase().includes(s)
  const matchManual = (m: ManualReg) => !s || (m.udid || '').toLowerCase().includes(s) || (m.created_by_name || '').toLowerCase().includes(s) || (m.code || '').toLowerCase().includes(s)

  const queue = useMemo(() => certs.filter((c) => (c.crm_status === 'pending' || c.crm_status === 'in_progress') && matchCert(c)), [certs, s])
  const allCerts = useMemo(() => certs.filter(matchCert), [certs, s])
  const manualList = useMemo(() => manual.filter(matchManual), [manual, s])

  const exportCurrent = () => {
    if (tab === 'manual') {
      exportCsv('bazzar-manual-registrations', manualList, [
        { key: 'created_at', label: 'Дата', value: (m) => new Date(m.created_at).toLocaleString('ru-RU') },
        { key: 'platform', label: 'Платформа' },
        { key: 'guarantee_months', label: 'Гарантия, мес' },
        { key: 'price', label: 'Цена' },
        { key: 'status', label: 'Статус' },
        { key: 'created_by_name', label: 'Создал' },
        { key: 'udid', label: 'UDID' },
        { key: 'code', label: 'Код' },
      ])
    } else {
      const rows = tab === 'queue' ? queue : allCerts
      exportCsv('bazzar-registrations', rows, [
        { key: 'created_at', label: 'Дата', value: (c) => new Date(c.created_at).toLocaleString('ru-RU') },
        { key: 'source', label: 'Канал', value: (c) => channelMeta(c.source).label },
        { key: 'plan_id', label: 'Товар' },
        { key: 'udid', label: 'UDID' },
        { key: 'sale_price', label: 'Цена' },
        { key: 'crm_status', label: 'Статус' },
      ])
    }
  }

  // ── Approval modal state ──────────────────────
  const [approvalCert, setApprovalCert] = useState<Cert | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [provFile, setProvFile] = useState<File | null>(null)
  const [certPassword, setCertPassword] = useState('')
  const [approvalComment, setApprovalComment] = useState('')
  const [uploading, setUploading] = useState(false)

  const act = (cert: Cert, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      // Open approval modal
      setApprovalCert(cert)
      setCertFile(null)
      setProvFile(null)
      setCertPassword('')
      setApprovalComment('')
      return
    }

    // Reject immediately
    const comment = window.prompt('Причина отклонения (необязательно):') || undefined
    setBusyId(cert.id)
    startTransition(async () => {
      try {
        const res = await updateCertStatus(cert.id, status, comment)
        if (!res?.success) throw new Error(res?.error || 'Ошибка')
        addToast('Сертификат отклонён', undefined, 'ok')
        router.refresh()
      } catch (e: any) {
        addToast('Ошибка', e.message || '', 'err')
      } finally {
        setBusyId(null)
      }
    })
  }

  const submitApproval = async () => {
    if (!approvalCert) return
    setUploading(true)
    const supabase = createClient()

    try {
      let certFileUrl: string | null = null
      let provFileUrl: string | null = null

      // Upload cert file (.p12) if provided
      if (certFile) {
        const path = `${approvalCert.id}/${Date.now()}_${certFile.name}`
        const { error: upErr } = await supabase.storage.from('cert-files').upload(path, certFile)
        if (upErr) throw new Error(`Ошибка загрузки .p12: ${upErr.message}`)
        const { data: urlData } = supabase.storage.from('cert-files').getPublicUrl(path)
        certFileUrl = urlData?.publicUrl || path
      }

      // Upload provision file (.mobileprovision) if provided
      if (provFile) {
        const path = `${approvalCert.id}/${Date.now()}_${provFile.name}`
        const { error: upErr } = await supabase.storage.from('cert-files').upload(path, provFile)
        if (upErr) throw new Error(`Ошибка загрузки .mobileprovision: ${upErr.message}`)
        const { data: urlData } = supabase.storage.from('cert-files').getPublicUrl(path)
        provFileUrl = urlData?.publicUrl || path
      }

      // Update cert record with files + password
      const updates: Record<string, string | null> = {}
      if (certFileUrl) updates.cert_file_url = certFileUrl
      if (provFileUrl) updates.provision_file_url = provFileUrl
      if (certPassword.trim()) updates.cert_password = certPassword.trim()

      if (Object.keys(updates).length > 0) {
        const { error: updErr } = await supabase
          .from('apple_certificates')
          .update(updates)
          .eq('id', approvalCert.id)
        if (updErr) console.error('Failed to save cert files:', updErr)
      }

      // Approve
      const res = await updateCertStatus(approvalCert.id, 'approved', approvalComment.trim() || undefined)
      if (!res?.success) throw new Error(res?.error || 'Ошибка')

      addToast('Сертификат согласован', certFileUrl ? 'Файлы прикреплены' : undefined, 'ok')
      setApprovalCert(null)
      router.refresh()
    } catch (e: any) {
      addToast('Ошибка', e.message || '', 'err')
    } finally {
      setUploading(false)
    }
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'queue', label: 'На согласовании', count: queue.length },
    { id: 'manual', label: 'Ручные заявки', count: manualList.length },
    { id: 'all', label: 'Все сертификаты', count: allCerts.length },
  ]

  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-[22px] font-bold tracking-tight">Регистрации</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск: UDID, товар, код" className="w-[220px] h-9 pl-9 pr-3 bg-card border border-line rounded-xl text-[13px] outline-none focus:border-accent" />
          </div>
          <button onClick={exportCurrent} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-line text-[12px] font-semibold text-mute hover:text-[#171821]">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
              tab === t.id ? 'bg-brand text-[#171821]' : 'text-mute hover:bg-black/[0.04]'
            }`}
          >
            {t.label}
            <span className={`min-w-5 px-1.5 rounded-full text-[11px] ${tab === t.id ? 'bg-[#171821] text-brand' : 'bg-black/[0.06]'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Очередь согласования */}
      {tab === 'queue' && (
        <div className="card divide-y divide-black/[0.05]">
          {queue.length === 0 && <div className="p-10 text-center text-mute">Очередь пуста — всё согласовано.</div>}
          {queue.map((c) => {
            const ch = channelMeta(c.source)
            const isBusy = busyId === c.id && pending
            return (
              <div key={c.id} className="p-4 flex items-center gap-4">
                <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-semibold" style={{ background: `${ch.color}1a`, color: ch.color }}>
                  {ch.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] truncate">{c.plan_id}</div>
                  <div className="text-[12px] text-mute">
                    UDID <code>{c.udid?.slice(0, 12)}…</code> · {money(c.sale_price)} · {dateTime(c.created_at)}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    disabled={isBusy}
                    onClick={() => act(c, 'approved')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ok text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    <Check size={15} /> Согласовать
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => act(c, 'rejected')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/[0.05] text-err text-[13px] font-semibold disabled:opacity-50"
                  >
                    <X size={15} /> Отклонить
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ручные заявки */}
      {tab === 'manual' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[13px] text-mute">Создайте заявку и отправьте ссылку клиенту (Авито/Telegram) — оплата и UDID на сайте.</div>
            <button onClick={() => { setShowCreate((v) => !v); setCreatedLink(null) }} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-[#171821] text-[13px] font-semibold">
              <Plus size={16} /> Создать заявку
            </button>
          </div>

          {createdLink && (
            <div className="card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-mute mb-0.5">Ссылка готова — отправьте клиенту</div>
                <div className="text-[13px] font-mono text-accent break-all">{createdLink}</div>
              </div>
              <button onClick={() => { navigator.clipboard?.writeText(createdLink); addToast('Скопировано', undefined, 'ok') }} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-white text-[12px] font-semibold">
                <Copy size={14} /> Копировать
              </button>
            </div>
          )}

          {showCreate && (
            <div className="card p-5 space-y-4">
              <div>
                <div className="text-[12px] font-semibold text-mute mb-2">Платформа</div>
                <div className="flex gap-2">
                  {[['avito', 'Авито'], ['telegram', 'Telegram'], ['other', 'Другое']].map(([k, label]) => (
                    <button key={k} onClick={() => setCPlatform(k)} className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold ${cPlatform === k ? 'bg-accent text-white' : 'bg-black/[0.04] text-mute'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-mute mb-2">Тариф</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {AVITO_TARIFFS.map((t) => (
                    <button key={t.guaranteeMonths} onClick={() => setCMonths(t.guaranteeMonths)} className={`rounded-xl p-3 text-left border ${cMonths === t.guaranteeMonths ? 'border-accent bg-accent/[0.06]' : 'border-line'}`}>
                      <div className="text-[13px] font-bold">{t.guaranteeMonths} мес</div>
                      <div className="text-[12px] text-mute">{t.price} ₽</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-mute mb-2">Доп. информация</div>
                <input value={cExtra} onChange={(e) => setCExtra(e.target.value)} placeholder="Напр.: клиент просит Scarlet" className="w-full bg-black/[0.03] border border-line rounded-xl px-3 py-2.5 text-[13px] outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-mute">Согласующий: <b>Артём Кошелев</b> @art.koshelev</div>
                <button disabled={pending} onClick={createReg} className="px-4 py-2.5 rounded-xl bg-ok text-white text-[13px] font-semibold disabled:opacity-50">
                  {pending ? 'Создаём…' : 'Создать и получить ссылку'}
                </button>
              </div>
            </div>
          )}

          <div className="card divide-y divide-black/[0.05]">
            {manualList.length === 0 && <div className="p-10 text-center text-mute">Заявок нет.</div>}
            {manualList.map((m) => {
            const st = MANUAL_STATUS[m.status] || { label: m.status, color: '#8B92B4' }
            const ch = channelMeta(m.platform)
            return (
              <div key={m.id} className="p-4 flex items-center gap-4">
                <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-lg text-[12px] font-semibold" style={{ background: `${ch.color}1a`, color: ch.color }}>{ch.label}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px]">{m.guarantee_months} мес · {money(m.price)}</div>
                  <div className="text-[12px] text-mute truncate">
                    {m.created_by_name || '—'} · {m.udid ? <code>{m.udid.slice(0, 8)}…</code> : 'без UDID'} · {dateTime(m.created_at)}
                    {m.extra_info ? ` · ${m.extra_info}` : ''}
                  </div>
                </div>
                <span className="shrink-0 px-2 py-1 rounded-lg text-[12px] font-semibold" style={{ background: `${st.color}1a`, color: st.color }}>{st.label}</span>
              </div>
            )
          })}
          </div>
        </div>
      )}

      {/* Все сертификаты */}
      {tab === 'all' && (
        <div className="card divide-y divide-black/[0.05]">
          {allCerts.length === 0 && <div className="p-10 text-center text-mute">Ничего не найдено.</div>}
          {allCerts.map((c) => {
            const st = CERT_STATUS[c.crm_status] || { label: c.crm_status, color: '#8B92B4' }
            const ch = channelMeta(c.source)
            return (
              <div key={c.id} className="p-4 flex items-center gap-4 text-[13px]">
                <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-lg text-[12px] font-semibold" style={{ background: `${ch.color}1a`, color: ch.color }}>{ch.label}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.plan_id}</div>
                  <div className="text-[12px] text-mute">UDID <code>{c.udid?.slice(0, 12)}…</code> · {dateTime(c.created_at)}</div>
                </div>
                <span className="shrink-0 tabular-nums font-semibold">{money(c.sale_price)}</span>
                <span className="shrink-0 px-2 py-1 rounded-lg text-[12px] font-semibold" style={{ background: `${st.color}1a`, color: st.color }}>{st.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Approval Modal ──────────────────────────────── */}
      {approvalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApprovalCert(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold">Согласовать сертификат</h3>
              <button onClick={() => setApprovalCert(null)} className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center text-mute hover:text-[#171821]">
                <X size={16} />
              </button>
            </div>

            <div className="text-[13px] text-mute">
              UDID: <code className="text-accent">{approvalCert.udid}</code>
              <br />
              Тариф: <strong>{approvalCert.plan_id}</strong> · {money(approvalCert.sale_price)}
            </div>

            {/* Cert file (.p12) */}
            <div>
              <label className="text-[12px] font-semibold text-mute block mb-1.5">
                <FileUp size={14} className="inline mr-1" />Сертификат (.p12)
              </label>
              <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${certFile ? 'border-accent bg-accent/[0.04]' : 'border-line hover:border-accent/50'}`}>
                <Upload size={16} className="text-mute" />
                <span className="text-[13px] text-mute truncate">{certFile ? certFile.name : 'Выберите файл .p12'}</span>
                <input type="file" accept=".p12,.pfx" hidden onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Provision file (.mobileprovision) */}
            <div>
              <label className="text-[12px] font-semibold text-mute block mb-1.5">
                <FileUp size={14} className="inline mr-1" />Provision Profile (.mobileprovision)
              </label>
              <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${provFile ? 'border-accent bg-accent/[0.04]' : 'border-line hover:border-accent/50'}`}>
                <Upload size={16} className="text-mute" />
                <span className="text-[13px] text-mute truncate">{provFile ? provFile.name : 'Выберите файл .mobileprovision'}</span>
                <input type="file" accept=".mobileprovision" hidden onChange={(e) => setProvFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Password */}
            <div>
              <label className="text-[12px] font-semibold text-mute block mb-1.5">
                <Lock size={14} className="inline mr-1" />Пароль сертификата
              </label>
              <input
                type="text"
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                placeholder="Пароль от .p12 файла"
                className="w-full h-10 px-3 bg-black/[0.02] border border-line rounded-xl text-[13px] outline-none focus:border-accent"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="text-[12px] font-semibold text-mute block mb-1.5">Комментарий (необязательно)</label>
              <input
                type="text"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Комментарий к согласованию"
                className="w-full h-10 px-3 bg-black/[0.02] border border-line rounded-xl text-[13px] outline-none focus:border-accent"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                disabled={uploading}
                onClick={submitApproval}
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {uploading ? (
                  <span className="animate-pulse">Загрузка...</span>
                ) : (
                  <><Check size={16} /> Согласовать</>
                )}
              </button>
              <button
                disabled={uploading}
                onClick={() => setApprovalCert(null)}
                className="px-4 h-10 rounded-xl bg-black/[0.05] text-[13px] font-semibold text-mute"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
