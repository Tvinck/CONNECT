'use client'

/**
 * app/(dashboard)/skinscan/[name]/page.tsx — Detail view for a selected skin.
 * Shows large skin preview, price comparison table, and price trend chart.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SkinCard } from '@/components/skinscan/SkinCard'
import { PriceTable } from '@/components/skinscan/PriceTable'
import { PriceChart } from '@/components/skinscan/PriceChart'
import { getSteamCdnUrl } from '@/lib/skinscan/utils'

interface MarketPrice {
  source: string
  priceUsd: number
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
  const [detail, setDetail] = useState<SkinDetail | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number>(92.5) // fallback

  useEffect(() => {
    // fetch skin prices
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/skinscan/prices?name=${encodeURIComponent(decodedName)}`)
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
      }
    }
    fetchData()
  }, [decodedName])

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8E92BC]">
        Загрузка данных скина...
      </div>
    )
  }

  const cdnUrl = getSteamCdnUrl(detail.icon_url)

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#8E92BC] hover:text-white transition-colors"
      >
        ← Назад
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Skin preview */}
        <SkinCard name={detail.market_hash_name} iconUrl={detail.icon_url} />

        {/* Price table */}
        <div className="flex-1 min-w-0">
          <PriceTable
            prices={detail.prices}
            exchangeRate={exchangeRate}
            skinName={detail.market_hash_name}
          />
        </div>
      </div>

      {/* Price trend chart */}
      <PriceChart history={detail.history.map((h) => ({ date: h.date, price: h.price }))} />
    </div>
  )
}
