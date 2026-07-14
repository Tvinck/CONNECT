'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react'

// Structure of weapon categories and individual weapons
const WEAPON_GROUPS = [
  {
    id: 'pistols',
    name: 'Пистолеты',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
        <path d="M4 8h10l1 2h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3.5L15 19h-3.5l1.5-4H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z" />
      </svg>
    ),
    weapons: [
      { id: 'Glock-18', name: 'Glock-18' },
      { id: 'USP-S', name: 'USP-S' },
      { id: 'Desert Eagle', name: 'Desert Eagle' },
      { id: 'P250', name: 'P250' },
      { id: 'Five-SeveN', name: 'Five-SeveN' },
      { id: 'Tec-9', name: 'Tec-9' },
      { id: 'Dual Berettas', name: 'Dual Berettas' },
      { id: 'CZ75-Auto', name: 'CZ75-Auto' },
      { id: 'R8 Revolver', name: 'Револьвер R8' }
    ]
  },
  {
    id: 'smgs',
    name: 'Пистолеты-пулеметы',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
        <path d="M2 10h12v4H2zm12-2h4v3h2v2h-4v2h-2zm-6 6v3h2v-3z" />
      </svg>
    ),
    weapons: [
      { id: 'MAC-10', name: 'MAC-10' },
      { id: 'MP9', name: 'MP9' },
      { id: 'PP-Bizon', name: 'ПП-19 Бизон' },
      { id: 'UMP-45', name: 'UMP-45' },
      { id: 'P90', name: 'P90' },
      { id: 'MP7', name: 'MP7' },
      { id: 'MP5-SD', name: 'MP5-SD' }
    ]
  },
  {
    id: 'rifles',
    name: 'Винтовки (Штурмовые)',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-400">
        <path d="M2 11h14l1 1h4v2h-4l-1 1H4l-1 2H2v-6z" />
      </svg>
    ),
    weapons: [
      { id: 'AK-47', name: 'AK-47' },
      { id: 'M4A4', name: 'M4A4' },
      { id: 'M4A1-S', name: 'M4A1-S' },
      { id: 'Galil AR', name: 'Galil AR' },
      { id: 'FAMAS', name: 'FAMAS' },
      { id: 'SG 553', name: 'SG 553' },
      { id: 'AUG', name: 'AUG' }
    ]
  },
  {
    id: 'snipers',
    name: 'Снайперские винтовки',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
        <path d="M1 12h17l1 1h3v1h-3l-1 1H5l-1 3H2v-6z" />
        <circle cx="10" cy="9" r="2" />
      </svg>
    ),
    weapons: [
      { id: 'AWP', name: 'AWP' },
      { id: 'SSG 08', name: 'SSG 08' },
      { id: 'SCAR-20', name: 'SCAR-20' },
      { id: 'G3SG1', name: 'G3SG1' }
    ]
  },
  {
    id: 'shotguns',
    name: 'Дробовики',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ok">
        <path d="M2 11h16v3H2zm16 1h4v1h-4zm-8 2h2v2h-2z" />
      </svg>
    ),
    weapons: [
      { id: 'Nova', name: 'Nova' },
      { id: 'XM1014', name: 'XM1014' },
      { id: 'MAG-7', name: 'MAG-7' },
      { id: 'Sawed-Off', name: 'Обрез' }
    ]
  },
  {
    id: 'machineguns',
    name: 'Пулеметы',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-400">
        <path d="M2 10h15v4H2zm15-1h3v2h2v2h-5zm-9 5v4h3v-4z" />
      </svg>
    ),
    weapons: [
      { id: 'Negev', name: 'Negev' },
      { id: 'M249', name: 'M249' }
    ]
  },
  {
    id: 'knives',
    name: 'Ножи',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pink-400">
        <path d="M18 3l3 3L8 19l-4 2 2-4L18 3z" />
      </svg>
    ),
    weapons: [
      { id: '★ Karambit', name: 'Керамбит' },
      { id: '★ M9 Bayonet', name: 'Штык-нож M9' },
      { id: '★ Butterfly Knife', name: 'Нож-бабочка' },
      { id: '★ Talon Knife', name: 'Нож-коготь' },
      { id: '★ Flip Knife', name: 'Складной нож' },
      { id: '★ Huntsman Knife', name: 'Охотничий нож' },
      { id: '★ Shadow Daggers', name: 'Тычковые ножи' },
      { id: '★ Bowie Knife', name: 'Нож Боуи' },
      { id: '★ Falchion Knife', name: 'Фальшион' },
      { id: '★ Gut Knife', name: 'Нож с лезвием-крюком' },
      { id: '★ Stiletto Knife', name: 'Стилет' },
      { id: '★ Ursus Knife', name: 'Нож Ursus' },
      { id: '★ Skeleton Knife', name: 'Скелетный нож' }
    ]
  },
  {
    id: 'gloves',
    name: 'Перчатки',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
        <path d="M6 10V5a2 2 0 0 1 4 0v5m-4 0a2 2 0 0 1-4 0V9a2 2 0 0 1 4 0v1zm4 0a2 2 0 0 1 4 0V6a2 2 0 0 1 4 0v4m-4 0a2 2 0 0 1 4 0V8a2 2 0 0 1 4 0v5a7 7 0 0 1-14 0v-3z" />
      </svg>
    ),
    weapons: [
      { id: '★ Sport Gloves', name: 'Спортивные перчатки' },
      { id: '★ Specialist Gloves', name: 'Перчатки «Специалист»' },
      { id: '★ Driver Gloves', name: 'Водительские перчатки' },
      { id: '★ Moto Gloves', name: 'Мотоциклетные перчатки' },
      { id: '★ Hand Wraps', name: 'Обмотки рук' },
      { id: '★ Bloodhound Gloves', name: 'Перчатки «Бладхаунд»' }
    ]
  }
]

// Popular collections for "Набор" dropdown
const COLLECTIONS = [
  { id: '', name: 'Все наборы' },
  { id: 'Revolution', name: 'Коллекция «Революция»' },
  { id: 'Dreams & Nightmares', name: 'Коллекция «Грезы и кошмары»' },
  { id: 'Riptide', name: 'Коллекция «Хищные воды»' },
  { id: 'Snakebite', name: 'Коллекция «Змеиный укус»' },
  { id: 'Fracture', name: 'Коллекция «Разлом»' },
  { id: 'Prisma 2', name: 'Коллекция «Призма 2»' },
  { id: 'Prisma', name: 'Коллекция «Призма»' },
  { id: 'Clutch', name: 'Коллекция «Решающий момент»' },
  { id: 'Horizon', name: 'Коллекция «Горизонт»' },
  { id: 'Spectrum 2', name: 'Коллекция «Спектр 2»' },
  { id: 'Gamma 2', name: 'Коллекция «Гамма 2»' },
  { id: 'Phoenix', name: 'Коллекция «Феникс»' }
]

function renderWeaponSilhouette(id: string) {
  const cleanId = id.replace('★ ', '')
  if (['Glock-18', 'USP-S', 'Desert Eagle', 'P250', 'Five-SeveN', 'Tec-9', 'CZ75-Auto', 'R8 Revolver'].some(w => cleanId.startsWith(w))) {
    return (
      <svg className="w-7 h-4.5 opacity-20 group-hover/item:opacity-50 transition-opacity text-slate-400" viewBox="0 0 24 12" fill="currentColor">
        <path d="M2 2h14l1 1v2.5h5v3.5h-4.5L14 9H9l1-2.5H2V2z" />
      </svg>
    )
  }
  if (cleanId.startsWith('Dual Berettas')) {
    return (
      <svg className="w-7 h-4.5 opacity-20 group-hover/item:opacity-50 transition-opacity text-slate-400" viewBox="0 0 24 12" fill="currentColor">
        <path d="M1 2h7l1 1v2h2v2h-1.5L8 9H4.5l1-2H1V2z M11 3.5h7l1 1v2h2v2h-1.5L18 10.5h-3.5l1-2h-3.5v-5z" />
      </svg>
    )
  }
  if (['AK-47', 'M4A4', 'M4A1-S', 'Galil AR', 'FAMAS', 'SG 553', 'AUG'].some(w => cleanId.startsWith(w))) {
    return (
      <svg className="w-8 h-4 opacity-20 group-hover/item:opacity-50 transition-opacity text-slate-400" viewBox="0 0 32 12" fill="currentColor">
        <path d="M1 4h18l1 1h9v2h-9l-1 1H3l-1 1.5H1V4zm9 2v2.5h1.5V6H10z" />
      </svg>
    )
  }
  if (['AWP', 'SSG 08', 'SCAR-20', 'G3SG1'].some(w => cleanId.startsWith(w))) {
    return (
      <svg className="w-8.5 h-4 opacity-20 group-hover/item:opacity-50 transition-opacity text-slate-400" viewBox="0 0 36 12" fill="currentColor">
        <path d="M1 5h18l1 1h14v1.5H22l-1 1H3l-1 2H1V5z M12 3.5h5v2h-5z M14 2h1v1.5h-1z" />
      </svg>
    )
  }
  if (['MAC-10', 'MP9', 'PP-Bizon', 'UMP-45', 'P90', 'MP7', 'MP5-SD'].some(w => cleanId.startsWith(w))) {
    return (
      <svg className="w-7 h-4.5 opacity-20 group-hover/item:opacity-50 transition-opacity text-slate-400" viewBox="0 0 24 12" fill="currentColor">
        <path d="M2 3h12v4.5H2zm12-1h4v2.5h2v2.5h-4v2.5h-2zm-6 5.5v3h2v-3z" />
      </svg>
    )
  }
  if (id.includes('Knife') || id.includes('Bayonet') || id.includes('Karambit') || id.includes('Daggers') || id.includes('Bowie') || id.includes('Falchion') || id.includes('Stiletto') || id.includes('Ursus') || id.includes('Skeleton')) {
    return (
      <svg className="w-7 h-4.5 opacity-20 group-hover/item:opacity-50 transition-opacity text-slate-400" viewBox="0 0 24 12" fill="currentColor">
        <path d="M19 1l2.5 2.5-13.5 8.5-3.5.5.5-3.5L19 1z M5.5 8.5l2 2" />
      </svg>
    )
  }
  if (id.includes('Gloves') || id.includes('Wraps')) {
    return (
      <svg className="w-7 h-4.5 opacity-20 group-hover/item:opacity-50 transition-opacity text-slate-400" viewBox="0 0 24 12" fill="currentColor">
        <path d="M4.5 8V3.5a1 1 0 0 1 2 0v4.5h1V4a1 1 0 0 1 2 0v4h1V5a1 1 0 0 1 2 0v5h-7V8z" />
      </svg>
    )
  }
  return (
    <svg className="w-7 h-4.5 opacity-20 group-hover/item:opacity-50 transition-opacity text-slate-400" viewBox="0 0 24 12" fill="currentColor">
      <path d="M1 4h18v3.5H1zm18.5 1h2.5v1.5h-2.5zm-8.5 4h2v2h-2z" />
    </svg>
  )
}

interface FilterSidebarProps {
  subQuery: string
  setSubQuery: (q: string) => void
  searchInDescription: boolean
  setSearchInDescription: (val: boolean) => void
  selectedWeapons: string[]
  setSelectedWeapons: (weapons: string[] | ((prev: string[]) => string[])) => void
  selectedCollection: string
  setSelectedCollection: (c: string) => void
  minPrice: string
  setMinPrice: (p: string) => void
  maxPrice: string
  setMaxPrice: (p: string) => void
  currency: 'RUB' | 'USD'
  exchangeRate: number
  onReset: () => void
  onQuickGloveToggle?: () => void
}

export function FilterSidebar({
  subQuery,
  setSubQuery,
  searchInDescription,
  setSearchInDescription,
  selectedWeapons,
  setSelectedWeapons,
  selectedCollection,
  setSelectedCollection,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  currency,
  exchangeRate,
  onReset,
  onQuickGloveToggle
}: FilterSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    pistols: true,
    smgs: false,
    rifles: true,
    snipers: false,
    shotguns: false,
    machineguns: false,
    knives: false,
    gloves: false
  })

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleWeaponToggle = (id: string) => {
    setSelectedWeapons(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const isRub = currency === 'RUB'
  const maxLimit = isRub ? 500000 : 5000
  const minVal = Number(minPrice) || 0
  const maxVal = Number(maxPrice) || maxLimit

  const handleMinSliderChange = (val: number) => {
    const nextMin = Math.min(val, maxVal - (isRub ? 1000 : 10))
    setMinPrice(nextMin === 0 ? '' : nextMin.toString())
  }

  const handleMaxSliderChange = (val: number) => {
    const nextMax = Math.max(val, minVal + (isRub ? 1000 : 10))
    setMaxPrice(nextMax === maxLimit ? '' : nextMax.toString())
  }

  const minPercent = Math.min(100, Math.max(0, (minVal / maxLimit) * 100))
  const maxPercent = Math.min(100, Math.max(0, (maxVal / maxLimit) * 100))

  return (
    <div className="w-full bg-card border border-line rounded-2xl p-5 space-y-6 shrink-0 shadow-[0_12px_40px_rgba(0,0,0,0.3)] text-slate-800">
      
      {/* Game Selection Dropdown */}
      <div className="relative border border-line rounded-xl bg-bg p-3 flex items-center justify-between cursor-default group">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#E67E22] to-[#D35400] flex items-center justify-center text-white text-[10px] font-black shadow-[0_0_8px_rgba(230,126,34,0.3)]">
            CS2
          </div>
          <div>
            <div className="text-[12.5px] font-bold text-slate-800 leading-tight">Counter-Strike 2</div>
            <div className="text-[9px] text-mute">Официальный каталог</div>
          </div>
        </div>
        <ChevronDown size={14} className="text-mute group-hover:text-slate-800 transition-colors" />
      </div>

      {/* Header controls */}
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-slate-800 font-bold text-[13px] uppercase tracking-wider">Фильтры поиска</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-mute hover:text-slate-800 transition-colors bg-black/[0.03] hover:bg-black/[0.05] px-2.5 py-1.5 rounded-lg border border-line"
          title="Сбросить все"
        >
          <RotateCcw size={11} />
          <span>Сбросить</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-[11.5px] font-semibold text-slate-400">Поиск по результатам</label>
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={subQuery}
            onChange={(e) => setSubQuery(e.target.value)}
            placeholder="Например: азимов, буйство..."
            className="w-full h-10 pl-10 pr-3.5 bg-bg border border-line rounded-xl text-[12.5px] text-slate-800 placeholder-mute2 focus:border-[#1472F5] outline-none transition-all"
          />
        </div>

        {/* Search in descriptions */}
        <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group/descr select-none text-[12px]">
          <input
            type="checkbox"
            checked={searchInDescription}
            onChange={(e) => setSearchInDescription(e.target.checked)}
            className="hidden"
          />
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
            searchInDescription
              ? 'bg-[#1472F5] border-[#1472F5] text-white'
              : 'border-line bg-bg group-hover/descr:border-mute2'
          }`}>
            {searchInDescription && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-mute group-hover/descr:text-slate-800 transition-colors">
            Искать в описаниях скинов
          </span>
        </label>
      </div>

      {/* Weapon Accordions */}
      <div className="space-y-2">
        <label className="text-[11.5px] font-semibold text-slate-400 block mb-1">Категории оружия</label>
        <div className="space-y-2">
          {WEAPON_GROUPS.map((group) => {
            const isExpanded = expandedGroups[group.id]
            const activeCount = group.weapons.filter(w => selectedWeapons.includes(w.id)).length

            return (
              <div key={group.id} className="border border-line rounded-xl overflow-hidden bg-bg/40">
                <div className="w-full flex items-stretch h-11">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex-1 flex items-center gap-2.5 px-4.5 py-2.5 text-left hover:bg-black/[0.03] transition-colors"
                  >
                    <span>{group.icon}</span>
                    <span className="text-[12.5px] font-bold text-slate-800 truncate">{group.name}</span>
                    {activeCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-[#1472F5] text-white text-[9px] font-bold rounded-lg">
                        {activeCount}
                      </span>
                    )}
                  </button>
                  <div className="w-[1px] bg-line my-2" />
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="px-3 hover:bg-black/[0.03] transition-colors flex items-center justify-center"
                  >
                    {isExpanded ? <ChevronUp size={13} className="text-mute" /> : <ChevronDown size={13} className="text-mute" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4.5 pb-3.5 pt-1.5 border-t border-line space-y-2 max-h-[220px] overflow-y-auto bg-bg/25">
                    <label
                      onClick={() => {
                        const ids = group.weapons.map(w => w.id)
                        setSelectedWeapons(prev => prev.filter(p => !ids.includes(p)))
                      }}
                      className="flex items-center gap-2.5 py-0.5 cursor-pointer group/item select-none text-[12.5px]"
                    >
                      <div className="w-4 h-4 rounded border flex items-center justify-center border-line bg-bg group-hover/item:border-mute2">
                        {activeCount === 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        )}
                      </div>
                      <span className="text-slate-400 group-hover/item:text-slate-800 transition-colors">
                        Все {group.name.toLowerCase()}
                      </span>
                    </label>

                    {group.weapons.map((w) => {
                      const isChecked = selectedWeapons.includes(w.id)
                      return (
                        <label
                          key={w.id}
                          className="flex items-center justify-between py-0.5 cursor-pointer group/item select-none text-[12.5px]"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleWeaponToggle(w.id)}
                              className="hidden"
                            />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-[#1472F5] border-[#1472F5] text-white'
                                : 'border-line bg-bg group-hover/item:border-mute2'
                            }`}>
                              {isChecked && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className={`${isChecked ? 'text-slate-800 font-semibold' : 'text-mute group-hover/item:text-slate-800'} transition-colors`}>
                              {w.name}
                            </span>
                          </div>

                          {renderWeaponSilhouette(w.id)}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Set (Набор) Dropdown */}
      <div className="space-y-2">
        <label className="text-[11.5px] font-semibold text-slate-400">Набор (Коллекция)</label>
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="w-full h-10 px-3 bg-bg border border-line rounded-xl text-[12.5px] text-slate-800 outline-none focus:border-[#1472F5] cursor-pointer"
        >
          {COLLECTIONS.map((c) => (
            <option key={c.id} value={c.id} className="bg-card text-slate-800">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Pills */}
      <div className="space-y-2">
        <label className="text-[11.5px] font-semibold text-slate-400">Быстрый выбор типа</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSubQuery('Кейс')}
            className={`py-2 px-3 rounded-lg border text-[11px] font-bold text-center transition-all ${
              subQuery === 'Кейс'
                ? 'bg-[#1472F5] border-[#1472F5] text-white'
                : 'bg-bg border-line text-mute hover:text-slate-800 hover:bg-black/[0.03]'
            }`}
          >
            Контейнер
          </button>
          <button
            onClick={() => setSubQuery('Наклейка')}
            className={`py-2 px-3 rounded-lg border text-[11px] font-bold text-center transition-all ${
              subQuery === 'Наклейка'
                ? 'bg-[#1472F5] border-[#1472F5] text-white'
                : 'bg-bg border-line text-mute hover:text-slate-800 hover:bg-black/[0.03]'
            }`}
          >
            Наклейка
          </button>
          <button
            onClick={() => {
              if (onQuickGloveToggle) {
                onQuickGloveToggle()
              } else {
                setExpandedGroups(p => ({ ...p, gloves: true }))
              }
            }}
            className="py-2 px-3 bg-bg border border-line text-mute hover:text-slate-800 hover:bg-black/[0.03] rounded-lg text-[11px] font-bold text-center transition-all"
          >
            Перчатки
          </button>
          <div className="relative group/other">
            <button className="w-full py-2 px-3 bg-bg border border-line text-mute hover:text-slate-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all">
              <span>Прочее</span>
              <ChevronDown size={10} />
            </button>
            <div className="absolute left-0 right-0 bottom-full mb-1 bg-bg border border-line rounded-lg shadow-xl overflow-hidden scale-0 group-hover/other:scale-100 origin-bottom transition-all z-35">
              <button onClick={() => setSubQuery('Музыка')} className="w-full px-2 py-1.5 text-left text-[10px] hover:bg-black/[0.04] text-slate-700">Наборы музыки</button>
              <button onClick={() => setSubQuery('Агент')} className="w-full px-2 py-1.5 text-left text-[10px] hover:bg-black/[0.04] text-slate-700">Агенты</button>
              <button onClick={() => setSubQuery('Нашивка')} className="w-full px-2 py-1.5 text-left text-[10px] hover:bg-black/[0.04] text-slate-700">Нашивки</button>
            </div>
          </div>
        </div>
      </div>

      {/* Price Slider Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-[11.5px] font-semibold text-slate-400">
            Диапазон цены ({isRub ? '₽ RUB' : '$ USD'})
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-1/2">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs select-none">
              {isRub ? '₽' : '$'}
            </span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Мин."
              className="w-full h-9 pl-6.5 pr-2.5 bg-bg border border-line rounded-xl text-[12.5px] text-slate-800 placeholder-mute2 focus:border-[#1472F5] outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-slate-600 text-xs select-none">—</span>
          <div className="relative w-1/2">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs select-none">
              {isRub ? '₽' : '$'}
            </span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Макс."
              className="w-full h-9 pl-6.5 pr-2.5 bg-bg border border-line rounded-xl text-[12.5px] text-slate-800 placeholder-mute2 focus:border-[#1472F5] outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Dual Slider */}
        <div className="relative pt-2 pb-3 select-none">
          <div className="relative w-full h-1.5 bg-line2 rounded-lg">
            <div
              className="absolute h-full bg-[#1472F5] rounded-lg shadow-[0_0_12px_rgba(20,114,245,0.4)]"
              style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={maxLimit}
              step={isRub ? 1000 : 10}
              value={minVal}
              onChange={(e) => handleMinSliderChange(Number(e.target.value))}
              className="absolute w-full h-1.5 bg-transparent pointer-events-none appearance-none cursor-pointer z-20 top-0 left-0 custom-range-slider"
              style={{ WebkitAppearance: 'none' }}
            />
            <input
              type="range"
              min={0}
              max={maxLimit}
              step={isRub ? 1000 : 10}
              value={maxVal}
              onChange={(e) => handleMaxSliderChange(Number(e.target.value))}
              className="absolute w-full h-1.5 bg-transparent pointer-events-none appearance-none cursor-pointer z-25 top-0 left-0 custom-range-slider"
              style={{ WebkitAppearance: 'none' }}
            />
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            .custom-range-slider::-webkit-slider-thumb {
              pointer-events: auto !important;
              width: 14px;
              height: 14px;
              border-radius: 50% !important;
              background: #ffffff !important;
              border: 2.5px solid #1472F5 !important;
              cursor: pointer !important;
              -webkit-appearance: none !important;
              box-shadow: 0 0 5px rgba(0,0,0,0.5);
              transition: transform 0.1s ease;
            }
            .custom-range-slider::-webkit-slider-thumb:hover {
              transform: scale(1.25);
            }
            .custom-range-slider::-moz-range-thumb {
              pointer-events: auto !important;
              width: 14px;
              height: 14px;
              border-radius: 50% !important;
              background: #ffffff !important;
              border: 2.5px solid #1472F5 !important;
              cursor: pointer !important;
              box-shadow: 0 0 5px rgba(0,0,0,0.5);
              transition: transform 0.1s ease;
            }
            .custom-range-slider::-moz-range-thumb:hover {
              transform: scale(1.25);
            }
          ` }} />
        </div>
      </div>
    </div>
  )
}
