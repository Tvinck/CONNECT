'use client'

/**
 * app/(dashboard)/skinscan/[name]/page.tsx — Страница детальной информации о скине.
 * Показывает превью, селекторы износа (Wear) и StatTrak, таблицу сравнения цен и график тренда.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SkinCard } from '@/components/skinscan/SkinCard'
import { PriceTable } from '@/components/skinscan/PriceTable'
import { PriceChart } from '@/components/skinscan/PriceChart'
import { SKIN_DATABASE } from '@/lib/skinscan/skinDatabase'

const WEARS = [
  { id: 'Factory New', abbr: 'FN', name: 'Прямо с завода' },
  { id: 'Minimal Wear', abbr: 'MW', name: 'Немного поношенное' },
  { id: 'Field-Tested', abbr: 'FT', name: 'После полевых испытаний' },
  { id: 'Well-Worn', abbr: 'WW', name: 'Поношенное' },
  { id: 'Battle-Scarred', abbr: 'BS', name: 'Закаленное в боях' }
]

interface MarketPrice {
  source: string
  priceUsd: number
  priceRub?: number
  url: string
}

interface SkinDetail {
  market_hash_name: string
  icon_url: string
  prices: MarketPrice[]
  history: { date: string; price: number }[]
}

export default function SkinDetailPage({ params }: { params: { name: string } }) {
  const router = useRouter()
  const decodedName = decodeURIComponent(params.name)

  // Extract base name and wear from decoded url param if present
  // e.g. "AK-47 | Redline (Field-Tested)" -> base: "AK-47 | Redline", wear: "Field-Tested"
  const hasWearInUrl = decodedName.includes('(')
  const baseNameFromUrl = hasWearInUrl ? decodedName.split('(')[0].trim() : decodedName
  let initialWear = 'Field-Tested'
  if (hasWearInUrl) {
    const match = decodedName.match(/\(([^)]+)\)/)
    if (match && match[1]) {
      initialWear = match[1]
    }
  }

  const [exterior, setExterior] = useState<string>(initialWear)
  const [stattrak, setStattrak] = useState<boolean>(decodedName.includes('StatTrak™'))
  const [detail, setDetail] = useState<SkinDetail | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number>(92.5)
  const [loading, setLoading] = useState<boolean>(true)

  // Find skin in database to display Russian details
  const skinDbEntry = SKIN_DATABASE.find(s => s.name === baseNameFromUrl)
  const displayNameRu = skinDbEntry ? skinDbEntry.nameRu : baseNameFromUrl

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/skinscan/prices?name=${encodeURIComponent(baseNameFromUrl)}&exterior=${exterior}&stattrak=${stattrak}`
        )
        if (res.ok) {
          const data = await res.json()
          setDetail(data)
        }
        const exRes = await fetch('/api/skinscan/exchange')
        if (exRes.ok) {
          const ex = await exRes.json()
          setExchangeRate(ex.rate || 92.5)
        }
      } catch (e) {
        console.error('Failed to load skin data', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [baseNameFromUrl, exterior, stattrak])

  // Build current display name with wear/stattrak tags
  const currentFullNameEn = `${stattrak ? 'StatTrak™ ' : ''}${baseNameFromUrl} (${exterior})`
  const currentFullNameRu = `${stattrak ? 'StatTrak™ ' : ''}${displayNameRu} (${WEARS.find(w => w.id === exterior)?.name || exterior})`

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/skinscan')}
        className="flex items-center gap-2 text-[#8E92BC] hover:text-white transition-colors text-sm font-semibold"
      >
        ← Вернуться к поиску
      </button>

      {/* Skin Header */}
      <div className="border-b border-white/[0.04] pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {currentFullNameRu}
        </h1>
        <p className="text-sm text-[#8E92BC] mt-1">
          {currentFullNameEn}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Preview & Configuration */}
        <div className="space-y-6 lg:col-span-1">
          {/* Preview Card */}
          <SkinCard
            name={currentFullNameEn}
            nameRu={currentFullNameRu}
            iconUrl={detail?.icon_url || skinDbEntry?.iconUrl || ''}
          />

          {/* Configuration Panel */}
          <div className="bg-[#1C1D2A] border border-white/[0.04] rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-[13.5px] uppercase tracking-wider text-slate-400">
              Настройки скина
            </h3>

            {/* StatTrak Switch */}
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
              <div>
                <div className="text-[13px] font-semibold text-white">StatTrak™</div>
                <div className="text-[11px] text-[#8E92BC]">Со счетчиком убийств</div>
              </div>
              <button
                onClick={() => setStattrak(!stattrak)}
                className={`w-12 h-6 rounded-full transition-all relative border ${
                  stattrak
                    ? 'bg-accent border-accent'
                    : 'bg-[#161721] border-white/[0.08]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1/2 -translate-y-1/2 transition-all ${
                    stattrak ? 'left-6 bg-[#0d0e12]' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Wear / Exterior Select */}
            <div className="space-y-2">
              <div className="text-[13px] font-semibold text-white">Качество (Wear)</div>
              <div className="grid grid-cols-1 gap-1.5">
                {WEARS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setExterior(w.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      exterior === w.id
                        ? 'bg-accent text-[#0d0e12] border-accent shadow-[0_0_10px_rgba(191,241,40,0.15)]'
                        : 'bg-[#161721] text-[#8E92BC] hover:text-white border-white/[0.04]'
                    }`}
                  >
                    <span>{w.name}</span>
                    <span className="opacity-60 text-[10px]">{w.abbr}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Prices & History */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-[#1C1D2A] border border-white/[0.04] rounded-2xl h-80 flex flex-col items-center justify-center text-[#8E92BC] gap-2">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Получение актуальных цен с площадок...</span>
            </div>
          ) : (
            <>
              {/* Price comparison table */}
              <PriceTable
                prices={detail?.prices || []}
                exchangeRate={exchangeRate}
                skinName={currentFullNameEn}
              />

              {/* Price trend chart */}
              {detail?.history && (
                <PriceChart history={detail.history.map((h) => ({ date: h.date, price: h.price }))} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
