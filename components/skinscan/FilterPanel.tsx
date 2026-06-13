'use client'

import { SlidersHorizontal, RefreshCw } from 'lucide-react'

export interface FilterState {
  exterior: string
  stattrak: 'all' | 'yes' | 'no'
  souvenir: 'all' | 'yes' | 'no'
  minPrice: string
  maxPrice: string
}

interface FilterPanelProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onReset: () => void
}

const EXTERIORS = [
  { id: '', label: 'Все состояния' },
  { id: 'Factory New', label: 'Factory New (FN)' },
  { id: 'Minimal Wear', label: 'Minimal Wear (MW)' },
  { id: 'Field-Tested', label: 'Field-Tested (FT)' },
  { id: 'Well-Worn', label: 'Well-Worn (WW)' },
  { id: 'Battle-Scarred', label: 'Battle-Scarred (BS)' },
]

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <div className="bg-[#1C1D2A] border border-white/[0.04] rounded-2xl p-5 w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-white font-semibold text-[15px]">
          <SlidersHorizontal size={18} className="text-[#BFF128]" />
          <span>Фильтры поиска</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-[#8E92BC] hover:text-[#BFF128] transition-all font-medium"
        >
          <RefreshCw size={12} />
          Сбросить
        </button>
      </div>

      <div className="space-y-5">
        {/* Exterior Select */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#5A5D7F] font-bold mb-2">
            Состояние (Exterior)
          </label>
          <select
            value={filters.exterior}
            onChange={(e) => updateFilter('exterior', e.target.value)}
            className="w-full h-10 px-3 bg-[#13141C] border border-white/[0.06] rounded-xl text-[13px] text-white outline-none focus:border-[#BFF128] transition-all cursor-pointer"
          >
            {EXTERIORS.map((ext) => (
              <option key={ext.id} value={ext.id} className="bg-[#1C1D2A]">
                {ext.label}
              </option>
            ))}
          </select>
        </div>

        {/* StatTrak Selector */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#5A5D7F] font-bold mb-2">
            StatTrak™
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#13141C] p-1 rounded-xl border border-white/[0.04]">
            {(['all', 'yes', 'no'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateFilter('stattrak', mode)}
                className={`h-8 rounded-lg text-xs font-semibold transition-all ${
                  filters.stattrak === mode
                    ? 'bg-[#BFF128] text-black shadow-[0_2px_8px_rgba(191,241,40,0.15)] font-extrabold'
                    : 'text-[#8E92BC] hover:text-white'
                }`}
              >
                {mode === 'all' ? 'Все' : mode === 'yes' ? 'Да' : 'Нет'}
              </button>
            ))}
          </div>
        </div>

        {/* Souvenir Selector */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#5A5D7F] font-bold mb-2">
            Сувенир (Souvenir)
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#13141C] p-1 rounded-xl border border-white/[0.04]">
            {(['all', 'yes', 'no'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateFilter('souvenir', mode)}
                className={`h-8 rounded-lg text-xs font-semibold transition-all ${
                  filters.souvenir === mode
                    ? 'bg-[#BFF128] text-black shadow-[0_2px_8px_rgba(191,241,40,0.15)] font-extrabold'
                    : 'text-[#8E92BC] hover:text-white'
                }`}
              >
                {mode === 'all' ? 'Все' : mode === 'yes' ? 'Да' : 'Нет'}
              </button>
            ))}
          </div>
        </div>

        {/* Price Bounds */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#5A5D7F] font-bold mb-2">
            Цена ($ USD)
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Мин"
              value={filters.minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
              className="w-1/2 h-10 px-3 bg-[#13141C] border border-white/[0.06] rounded-xl text-[13px] text-white outline-none focus:border-[#BFF128] transition-all placeholder-slate-600"
            />
            <span className="text-[#5A5D7F]">—</span>
            <input
              type="number"
              placeholder="Макс"
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', e.target.value)}
              className="w-1/2 h-10 px-3 bg-[#13141C] border border-white/[0.06] rounded-xl text-[13px] text-white outline-none focus:border-[#BFF128] transition-all placeholder-slate-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
