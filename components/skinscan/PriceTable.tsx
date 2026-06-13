'use client'

/**
 * PriceTable.tsx — Таблица сравнения цен на скин по маркетплейсам.
 *
 * Функции:
 *  - Отображает цены с каждого маркетплейса (USD + RUB).
 *  - Подсвечивает минимальную цену зелёным, максимальную — красным.
 *  - Показывает разницу от Steam Market (15% комиссия).
 *  - Содержит ссылки на покупку с реферальными параметрами.
 *  - Сортирует по цене (от дешёвой к дорогой).
 */

import { ExternalLink, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { MARKET_META, type MarketPrice } from '@/lib/skinscan/utils'

interface PriceTableProps {
  prices: MarketPrice[]
  exchangeRate: number
  skinName: string
}

export function PriceTable({ prices, exchangeRate, skinName }: PriceTableProps) {
  if (!prices || prices.length === 0) {
    return (
      <div className="bg-[#1C1D2A] border border-white/[0.04] rounded-2xl p-8 text-center">
        <p className="text-[#8E92BC] text-sm">Цены не найдены для этого скина.</p>
      </div>
    )
  }

  // Sort prices from lowest to highest
  const sorted = [...prices].sort((a, b) => a.priceUsd - b.priceUsd)
  const minPrice = sorted[0]?.priceUsd ?? 0
  const maxPrice = sorted[sorted.length - 1]?.priceUsd ?? 0

  // Steam market baseline (15% commission on top of average)
  const avgPrice = sorted.reduce((sum, p) => sum + p.priceUsd, 0) / sorted.length
  const steamBaseline = Math.round(avgPrice * 1.15 * 100) / 100

  return (
    <div className="bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="text-white font-semibold text-[15px]">
          💰 Сравнение цен
        </h3>
        <div className="flex items-center gap-3 text-xs text-[#8E92BC]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Лучшая цена
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Макс. цена
          </span>
        </div>
      </div>

      {/* Steam Baseline */}
      <div className="px-5 py-3 bg-[#161721] border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#8E92BC]">
          <img
            src="https://store.steampowered.com/favicon.ico"
            alt="Steam"
            className="w-4 h-4 rounded"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span>Steam Market (ориентир, с учётом ~15% комиссии)</span>
        </div>
        <div className="text-xs font-semibold text-amber-400">
          ${steamBaseline.toFixed(2)} / {(steamBaseline * exchangeRate).toFixed(0)} ₽
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#5A5D7F] font-bold border-b border-white/[0.04]">
              <th className="px-5 py-3">Маркетплейс</th>
              <th className="px-5 py-3 text-right">Цена (USD)</th>
              <th className="px-5 py-3 text-right">Цена (RUB)</th>
              <th className="px-5 py-3 text-right">Разница</th>
              <th className="px-5 py-3 text-center">Купить</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => {
              const isMin = item.priceUsd === minPrice
              const isMax = item.priceUsd === maxPrice && prices.length > 1
              const meta = MARKET_META[item.source]
              const displayName = meta?.name || item.source
              const diffFromMin = item.priceUsd - minPrice
              const diffPercent = minPrice > 0 ? ((diffFromMin / minPrice) * 100).toFixed(1) : '0.0'
              const rubPrice = Math.round(item.priceUsd * exchangeRate)

              return (
                <tr
                  key={item.source}
                  className={`border-b border-white/[0.02] transition-colors hover:bg-white/[0.02] ${
                    isMin ? 'bg-emerald-500/[0.04]' : isMax ? 'bg-red-500/[0.04]' : ''
                  }`}
                >
                  {/* Marketplace name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isMin ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                          isMax ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
                          'bg-[#5A5D7F]'
                        }`}
                      />
                      <span className={`text-[13.5px] font-semibold ${
                        isMin ? 'text-emerald-400' :
                        isMax ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {displayName}
                      </span>
                      {isMin && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                          Best
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Price USD */}
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-[14px] font-bold tabular-nums ${
                      isMin ? 'text-emerald-400' :
                      isMax ? 'text-red-400' :
                      'text-white'
                    }`}>
                      ${item.priceUsd.toFixed(2)}
                    </span>
                  </td>

                  {/* Price RUB */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[13px] text-[#8E92BC] tabular-nums">
                      {rubPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </td>

                  {/* Difference */}
                  <td className="px-5 py-3.5 text-right">
                    {isMin ? (
                      <span className="flex items-center justify-end gap-1 text-xs text-emerald-400 font-medium">
                        <Minus size={12} />
                        Лучшая
                      </span>
                    ) : (
                      <span className="flex items-center justify-end gap-1 text-xs text-red-400/80 font-medium">
                        <TrendingUp size={12} />
                        +${diffFromMin.toFixed(2)} ({diffPercent}%)
                      </span>
                    )}
                  </td>

                  {/* Buy link */}
                  <td className="px-5 py-3.5 text-center">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        isMin
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-white/[0.04] text-[#8E92BC] hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      Купить <ExternalLink size={10} />
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer — Summary */}
      <div className="px-5 py-3 bg-[#161721] border-t border-white/[0.04] flex items-center justify-between text-xs text-[#8E92BC]">
        <span>Найдено: {sorted.length} маркетплейсов</span>
        <span>
          Экономия до{' '}
          <span className="text-emerald-400 font-bold">
            ${(maxPrice - minPrice).toFixed(2)}
          </span>{' '}
          ({minPrice > 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(1) : '0.0'}%)
        </span>
      </div>
    </div>
  )
}
