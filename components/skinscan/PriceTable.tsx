'use client'

/**
 * PriceTable.tsx — Таблица сравнения цен на скин по маркетплейсам.
 *
 * Функции:
 *  - Отображает цены с каждого маркетплейса (USD + RUB).
 *  - Позволяет переключать основную валюту (USD / RUB).
 *  - Подсвечивает минимальную цену зелёным, максимальную — красным.
 *  - Показывает разницу от Steam Market.
 *  - Содержит ссылки на покупку.
 *  - Сортирует по цене (от дешёвой к дорогой).
 */

import { useState } from 'react'
import { ExternalLink, TrendingUp, Minus } from 'lucide-react'
import { MARKET_META, type MarketPrice } from '@/lib/skinscan/utils'

interface PriceTableProps {
  prices: MarketPrice[]
  exchangeRate: number
  skinName: string
}

export function PriceTable({ prices, exchangeRate, skinName }: PriceTableProps) {
  const [currency, setCurrency] = useState<'USD' | 'RUB'>('RUB') // Ruble is default

  if (!prices || prices.length === 0) {
    return (
      <div className="bg-card border border-line rounded-2xl p-8 text-center">
        <p className="text-mute text-sm">Цены не найдены для этого скина.</p>
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
    <div className="bg-card border border-line rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg/40">
        <div className="flex items-center gap-3">
          <h3 className="text-slate-800 font-semibold text-[15px]">
            💰 Сравнение цен
          </h3>
          {/* Currency Switcher */}
          <div className="inline-flex rounded-lg bg-bg p-0.5 border border-line shrink-0">
            <button
              onClick={() => setCurrency('RUB')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                currency === 'RUB'
                  ? 'bg-accent text-[#0d0e12]'
                  : 'text-mute hover:text-slate-800'
              }`}
            >
              RUB (₽)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                currency === 'USD'
                  ? 'bg-accent text-[#0d0e12]'
                  : 'text-mute hover:text-slate-800'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-mute">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ok shadow-[0_0_6px_rgba(16,185,129,0.4)]" /> Лучшая цена
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-err shadow-[0_0_6px_rgba(239,68,68,0.4)]" /> Макс. цена
          </span>
        </div>
      </div>

      {/* Steam Baseline */}
      <div className="px-5 py-3 bg-bg border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-mute">
          <img
            src="https://store.steampowered.com/favicon.ico"
            alt="Steam"
            className="w-4 h-4 rounded"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span>Steam Market (ориентир, включая ~15% комиссии)</span>
        </div>
        <div className="text-xs font-semibold text-amber-500">
          {currency === 'RUB'
            ? `${Math.round(steamBaseline * exchangeRate).toLocaleString('ru-RU')} ₽`
            : `$${steamBaseline.toFixed(2)}`
          }
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-mute font-bold border-b border-line bg-bg/40">
              <th className="px-5 py-3">Площадка</th>
              <th className="px-5 py-3 text-right">Основная цена</th>
              <th className="px-5 py-3 text-right">В другой валюте</th>
              <th className="px-5 py-3 text-right">Разница</th>
              <th className="px-5 py-3 text-center">Купить</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => {
              const isMin = item.priceUsd === minPrice
              const isMax = item.priceUsd === maxPrice && prices.length > 1
              const meta = MARKET_META[item.source]
              const displayName = meta?.name || item.source
              const rubPrice = item.priceRub ?? Math.round(item.priceUsd * exchangeRate * 100) / 100

              const diffFromMinUsd = item.priceUsd - minPrice
              const diffFromMinRub = diffFromMinUsd * exchangeRate
              const diffPercent = minPrice > 0 ? ((diffFromMinUsd / minPrice) * 100).toFixed(1) : '0.0'

              return (
                <tr
                  key={item.source}
                  className={`border-b border-line transition-colors hover:bg-black/[0.02] ${
                    isMin ? 'bg-ok/[0.04]' : isMax ? 'bg-err/[0.04]' : ''
                  }`}
                >
                  {/* Marketplace name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isMin ? 'bg-ok shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                          isMax ? 'bg-err shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
                          'bg-mute2'
                        }`}
                      />
                      <span className={`text-[13.5px] font-semibold ${
                        isMin ? 'text-ok' :
                        isMax ? 'text-red-600' :
                        'text-slate-800'
                      }`}>
                        {displayName}
                      </span>
                      {isMin && (
                        <span className="px-1.5 py-0.5 rounded bg-ok/20 text-ok text-[9px] font-bold uppercase tracking-wider scale-90 origin-left">
                          Best
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Primary Price */}
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-[14px] font-bold tabular-nums ${
                      isMin ? 'text-ok' :
                      isMax ? 'text-red-600' :
                      'text-slate-800'
                    }`}>
                      {currency === 'RUB'
                        ? `${Math.round(rubPrice).toLocaleString('ru-RU')} ₽`
                        : `$${item.priceUsd.toFixed(2)}`
                      }
                    </span>
                  </td>

                  {/* Secondary Price */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[12.5px] text-mute tabular-nums">
                      {currency === 'RUB'
                        ? `$${item.priceUsd.toFixed(2)}`
                        : `${Math.round(rubPrice).toLocaleString('ru-RU')} ₽`
                      }
                    </span>
                  </td>

                  {/* Difference */}
                  <td className="px-5 py-3.5 text-right">
                    {isMin ? (
                      <span className="flex items-center justify-end gap-1 text-xs text-ok font-medium">
                        <Minus size={12} />
                        Лучшая
                      </span>
                    ) : (
                      <span className="flex items-center justify-end gap-1 text-xs text-err font-medium">
                        <TrendingUp size={12} />
                        +{currency === 'RUB'
                          ? `${Math.round(diffFromMinRub).toLocaleString('ru-RU')} ₽`
                          : `$${diffFromMinUsd.toFixed(2)}`
                        } ({diffPercent}%)
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
                          ? 'bg-ok/20 text-ok hover:bg-ok/30'
                          : 'bg-black/[0.04] text-mute hover:text-slate-800 hover:bg-black/[0.07]'
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
      <div className="px-5 py-3 bg-bg border-t border-line flex items-center justify-between text-xs text-mute">
        <span>Найдено предложений: {sorted.length}</span>
        <span>
          Экономия до{' '}
          <span className="text-ok font-bold">
            {currency === 'RUB'
              ? `${Math.round((maxPrice - minPrice) * exchangeRate).toLocaleString('ru-RU')} ₽`
              : `$${(maxPrice - minPrice).toFixed(2)}`
            }
          </span>{' '}
          ({minPrice > 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(1) : '0.0'}%)
        </span>
      </div>
    </div>
  )
}
