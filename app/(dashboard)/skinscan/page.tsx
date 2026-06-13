'use client'

/**
 * app/(dashboard)/skinscan/page.tsx — Главная страница СкинСкан.
 * Премиальный дизайн с Hero-баннером, интерактивными категориями, расширенными фильтрами в стиле Steam,
 * сортировкой, переключением валюты (RUB/USD) и адаптивным мобильным интерфейсом.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/skinscan/SearchBar'
import { SkinCard } from '@/components/skinscan/SkinCard'
import { FilterSidebar } from '@/components/skinscan/FilterSidebar'
import { SKIN_DATABASE } from '@/lib/skinscan/skinDatabase'
import { getSteamCdnUrl, getSkinBasePrice } from '@/lib/skinscan/utils'
import { Flame, Star, Sparkles, Trophy, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react'

const CATEGORIES = [
  { id: 'all', name: 'Все скины', icon: '🔥' },
  { id: 'rifles', name: 'Автоматы', icon: '🔫' },
  { id: 'snipers', name: 'Винтовки', icon: '🎯' },
  { id: 'pistols', name: 'Пистолеты', icon: '💣' },
  { id: 'knives', name: 'Ножи', icon: '🔪' },
  { id: 'gloves', name: 'Перчатки', icon: '🧤' },
]

export default function SkinScanHome() {
  const router = useRouter()
  
  // Basic states
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [visibleCount, setVisibleCount] = useState(24)
  const [exchangeRate, setExchangeRate] = useState<number>(92.5)
  const [currency, setCurrency] = useState<'RUB' | 'USD'>('RUB')
  const [sortBy, setSortBy] = useState<string>('popularity')
  
  // Filter States
  const [subQuery, setSubQuery] = useState('')
  const [searchInDescription, setSearchInDescription] = useState(false)
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  
  // UI States
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const handleSelect = (name: string) => {
    const slug = encodeURIComponent(name)
    router.push(`/skinscan/${slug}`)
  }

  // Fetch exchange rate for display
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('/api/skinscan/exchange')
        if (res.ok) {
          const data = await res.json()
          setExchangeRate(data.rate || 92.5)
        }
      } catch (e) {
        console.warn('Failed to fetch rate, using fallback')
      }
    }
    fetchRate()
  }, [])

  // Reset pagination when category, filters, or sorting changes
  useEffect(() => {
    setVisibleCount(24)
  }, [selectedCategory, subQuery, selectedWeapons, selectedCollection, minPrice, maxPrice, sortBy])

  // Reset all filters helper
  const handleResetFilters = () => {
    setSubQuery('')
    setSearchInDescription(false)
    setSelectedWeapons([])
    setSelectedCollection('')
    setMinPrice('')
    setMaxPrice('')
  }

  // Quick Glove select helper (pills in sidebar)
  const handleQuickGloveToggle = () => {
    setSelectedCategory('gloves')
    setSelectedWeapons([])
  }

  // Helper to check if skin belongs to a specific collection/case
  const matchesCollectionRule = (skinName: string, collId: string) => {
    if (!collId) return true
    
    // Check by popular items from collections
    const cleanName = skinName.toLowerCase()
    if (collId === 'Revolution') {
      return ['temukau', 'head shot', 'reentry', 'water element', 'banana', 'featherweight', 'embezzler'].some(w => cleanName.includes(w))
    }
    if (collId === 'Dreams & Nightmares') {
      return ['nightwish', 'starlight', 'zombie', 'insomnia', 'beware', 'spirit board'].some(w => cleanName.includes(w))
    }
    if (collId === 'Riptide') {
      return ['ocean drive', 'gold arabesque', 'leash', 'spectator', 'toy soldier', 'mount fuji'].some(w => cleanName.includes(w))
    }
    if (collId === 'Snakebite') {
      return ['traitor', 'in living color', 'trigger discipline', 'slate', 'cyber security', 'food chain'].some(w => cleanName.includes(w))
    }
    if (collId === 'Fracture') {
      return ['printstream', 'legion of anubis', 'tooth fairy', 'vogue', 'brotherhood', 'monster'].some(w => cleanName.includes(w))
    }
    if (collId === 'Prisma 2') {
      return ['player two', 'bullet queen', 'phantom', 'acid wash', 'capillary', 'apocalypse'].some(w => cleanName.includes(w))
    }
    if (collId === 'Prisma') {
      return ['emperor', 'angry mob', 'light rail', 'uncharted', 'atheris', 'momentum'].some(w => cleanName.includes(w))
    }
    if (collId === 'Clutch') {
      return ['neo-noir', 'wild lily', 'mortis', 'stymphalian', 'cortex', 'black sand'].some(w => cleanName.includes(w))
    }
    if (collId === 'Horizon') {
      return ['eco', 'neon rider', 'code red', 'toy soldier', 'paw', 'fever dream'].some(w => cleanName.includes(w))
    }
    if (collId === 'Spectrum 2') {
      return ['empress', 'neonist', 'leads', 'hunter', 'goat', 'crackle'].some(w => cleanName.includes(w))
    }
    if (collId === 'Gamma 2') {
      return ['desolate space', 'roll cage', 'cyber', 'iron clad', 'ventilator'].some(w => cleanName.includes(w))
    }
    if (collId === 'Phoenix') {
      return ['asiimov', 'redline', 'triglyph', 'chameleon', 'sand dune'].some(w => cleanName.includes(w))
    }
    return true
  }

  // Filter skins logic
  const filteredSkins = SKIN_DATABASE.filter(skin => {
    // 1. Top Category tab filter
    const matchesCategory = selectedCategory === 'all' || skin.category === selectedCategory

    // 2. Sidebar weapons checklist filter (if any are selected)
    const matchesWeapon = selectedWeapons.length === 0 || selectedWeapons.some(wId => {
      // Clean skin name and weapon ID
      const cleanSkinName = skin.name.replace('★ ', '')
      return cleanSkinName.startsWith(wId)
    })

    // 3. SubQuery search filter (nameRu / name)
    const q = subQuery.trim().toLowerCase()
    let matchesSearch = true
    if (q) {
      const nameMatch = skin.name.toLowerCase().includes(q) || skin.nameRu.toLowerCase().includes(q)
      
      let descMatch = false
      if (searchInDescription) {
        // If descriptions search is active, match category tags or custom text attributes
        descMatch = skin.category.toLowerCase().includes(q) || 
                    (skin.name.includes('★') && 'нож перчатки редкий предмет'.includes(q))
      }
      matchesSearch = nameMatch || descMatch
    }

    // 4. Collection filter
    const matchesCollection = matchesCollectionRule(skin.name, selectedCollection)

    // 5. Price range filter
    const basePriceUsd = getSkinBasePrice(skin.name)
    const priceVal = currency === 'RUB' ? basePriceUsd * exchangeRate : basePriceUsd
    
    const min = minPrice.trim() !== '' ? Number(minPrice) : 0
    const max = maxPrice.trim() !== '' ? Number(maxPrice) : Infinity
    const matchesPrice = priceVal >= min && priceVal <= max

    return matchesCategory && matchesWeapon && matchesSearch && matchesCollection && matchesPrice
  })

  // Sort skins logic
  const sortedSkins = [...filteredSkins].sort((a, b) => {
    if (sortBy === 'name') {
      return a.nameRu.localeCompare(b.nameRu, 'ru')
    }
    if (sortBy === 'priceAsc') {
      return getSkinBasePrice(a.name) - getSkinBasePrice(b.name)
    }
    if (sortBy === 'priceDesc') {
      return getSkinBasePrice(b.name) - getSkinBasePrice(a.name)
    }
    // popularity: keeps original database order
    return 0
  })

  const displayedSkins = sortedSkins.slice(0, visibleCount)

  // Top 3 featured skins for the hero section highlight
  const featuredSkins = SKIN_DATABASE.filter(skin => 
    ['★ Karambit | Fade', 'AWP | Dragon Lore', 'AK-47 | Redline'].includes(skin.name)
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1C1D2A] via-[#151622] to-[#1C1D2A] border border-white/[0.05] p-6 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1472F5]/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple/[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1472F5]/[0.08] text-[#1472F5] text-[11px] font-bold uppercase tracking-wider mb-4 border border-[#1472F5]/[0.15]">
            <Flame size={12} className="animate-pulse" /> Live Price Aggregator
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Сравнивайте цены на скины <br className="hidden md:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1472F5] to-cyan">CS2 в реальном времени</span>
          </h1>
          <p className="text-[#8E92BC] text-sm md:text-[15px] mt-4 leading-relaxed max-w-xl">
            Поиск по базе официальных скинов CS2. Сравнивайте предложения с 18 популярных площадок, фильтруйте по износу и находите лучшие цены.
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 md:gap-10 mt-8 pt-6 border-t border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1472F5]/[0.06] rounded-xl text-[#1472F5] border border-[#1472F5]/[0.1]">
                <Trophy size={18} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">1,240+</div>
                <div className="text-[10px] text-[#5A5D7F] uppercase font-bold tracking-wider">Скинов в базе</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple/[0.06] rounded-xl text-purple border border-purple/[0.1]">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">18</div>
                <div className="text-[10px] text-[#5A5D7F] uppercase font-bold tracking-wider">Маркетплейсов</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/[0.06] rounded-xl text-emerald-400 border border-emerald-500/[0.1]">
                <Star size={18} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{exchangeRate.toFixed(1)} ₽</div>
                <div className="text-[10px] text-[#5A5D7F] uppercase font-bold tracking-wider">Курс доллара</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global search */}
      <div className="bg-[#1C1D2A] border border-white/[0.04] p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <SearchBar onSelect={handleSelect} />
      </div>

      {/* Featured Highlight row */}
      {selectedCategory === 'all' && !subQuery && selectedWeapons.length === 0 && !selectedCollection && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#1472F5]" />
            <h2 className="text-[13px] uppercase tracking-wider text-[#5A5D7F] font-bold">
              Популярные хайлайты
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredSkins.map((skin) => (
              <div 
                key={skin.name}
                onClick={() => handleSelect(skin.name)}
                className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C1D2A] to-[#13141C] border border-white/[0.05] p-5 hover:border-[#1472F5]/40 transition-all flex items-center justify-between"
              >
                <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-[#1472F5]/[0.03] rounded-full blur-xl group-hover:bg-[#1472F5]/[0.08] transition-all" />
                
                <div className="space-y-1 z-10 flex-1 min-w-0 pr-2">
                  <div className="px-1.5 py-0.5 rounded bg-[#1472F5]/[0.08] text-[#1472F5] text-[9px] font-bold uppercase tracking-wider inline-block">
                    Трендовый скин
                  </div>
                  <h3 className="text-white font-bold text-[14px] truncate mt-1.5">
                    {skin.nameRu}
                  </h3>
                  <p className="text-[#8E92BC] text-[11px] truncate">
                    {skin.name}
                  </p>
                </div>
                
                <div className="relative w-20 h-16 shrink-0 flex items-center justify-center">
                  <img 
                    src={getSteamCdnUrl(skin.iconUrl)} 
                    alt={skin.name} 
                    className="w-16 h-12 object-contain group-hover:scale-105 transition-all duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main layout with sidebar and grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: Filter Sidebar (sticky on desktop) */}
        <aside className="w-full lg:w-[310px] shrink-0 sticky top-24 hidden lg:block">
          <FilterSidebar
            subQuery={subQuery}
            setSubQuery={setSubQuery}
            searchInDescription={searchInDescription}
            setSearchInDescription={setSearchInDescription}
            selectedWeapons={selectedWeapons}
            setSelectedWeapons={setSelectedWeapons}
            selectedCollection={selectedCollection}
            setSelectedCollection={setSelectedCollection}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            currency={currency}
            exchangeRate={exchangeRate}
            onReset={handleResetFilters}
            onQuickGloveToggle={handleQuickGloveToggle}
          />
        </aside>

        {/* Right Column: Catalog results and controls */}
        <div className="flex-1 w-full space-y-5">
          
          {/* Categories top bar */}
          <div className="flex flex-wrap gap-2 border-b border-white/[0.04] pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-[#1472F5] text-white font-bold border-[#1472F5] shadow-[0_0_15px_rgba(20,114,245,0.25)]'
                    : 'bg-[#1C1D2A] text-[#8E92BC] hover:text-white border-white/[0.02] hover:bg-white/[0.01]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Sorting, currency, and mobile filter toggle */}
          <div className="bg-[#1C1D2A] border border-white/[0.04] p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="flex lg:hidden items-center gap-2 px-4 py-2 bg-[#13141C] border border-white/[0.08] text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                <SlidersHorizontal size={14} className="text-[#1472F5]" />
                <span>Фильтры</span>
                {(selectedWeapons.length > 0 || subQuery || selectedCollection || minPrice || maxPrice) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                )}
              </button>

              {/* Sorting selector */}
              <div className="flex items-center gap-2 bg-[#13141C] border border-white/[0.08] px-3.5 py-2 rounded-xl">
                <ArrowUpDown size={12} className="text-[#8E92BC]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs text-[#8E92BC] hover:text-white font-bold outline-none cursor-pointer pr-1"
                >
                  <option value="popularity" className="bg-[#1C1D2A]">Популярность</option>
                  <option value="name" className="bg-[#1C1D2A]">Название (А-Я)</option>
                  <option value="priceAsc" className="bg-[#1C1D2A]">Сначала дешевые</option>
                  <option value="priceDesc" className="bg-[#1C1D2A]">Сначала дорогие</option>
                </select>
              </div>
            </div>

            {/* Currency toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-3.5">
              <span className="text-[11px] text-[#8E92BC] font-semibold uppercase tracking-wider hidden xs:inline">
                Валюта:
              </span>
              <div className="inline-flex rounded-xl bg-[#13141C] p-1 border border-white/[0.06]">
                <button
                  onClick={() => setCurrency('RUB')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currency === 'RUB'
                      ? 'bg-[#1472F5] text-white shadow-md'
                      : 'text-[#8E92BC] hover:text-white'
                  }`}
                >
                  ₽ RUB
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currency === 'USD'
                      ? 'bg-[#1472F5] text-white shadow-md'
                      : 'text-[#8E92BC] hover:text-white'
                  }`}
                >
                  $ USD
                </button>
              </div>
            </div>
          </div>

          {/* Results Count & active filter tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8E92BC] py-1">
            <span className="font-medium">
              Показано скинов: <span className="text-white font-semibold">{Math.min(displayedSkins.length, sortedSkins.length)}</span> из <span className="text-white font-semibold">{sortedSkins.length}</span>
            </span>

            {/* Clear Filters indicator */}
            {(selectedWeapons.length > 0 || subQuery || selectedCollection || minPrice || maxPrice) && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-[#1472F5] hover:text-blue-400 transition-colors"
              >
                Сбросить активные фильтры
              </button>
            )}
          </div>

          {/* Skin Cards Grid */}
          {displayedSkins.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedSkins.map((skin) => {
                const basePriceUsd = getSkinBasePrice(skin.name)
                const priceVal = currency === 'RUB' ? basePriceUsd * exchangeRate : basePriceUsd

                return (
                  <SkinCard
                    key={skin.name}
                    name={skin.name}
                    nameRu={skin.nameRu}
                    iconUrl={skin.iconUrl}
                    price={priceVal}
                    currency={currency}
                    onClick={() => handleSelect(skin.name)}
                  />
                )
              })}
            </div>
          ) : (
            <div className="bg-[#1C1D2A] border border-white/[0.04] rounded-2xl p-16 text-center text-[#8E92BC] flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-slate-500 text-lg">
                ❓
              </div>
              <div>
                <p className="text-white font-bold text-[14px]">Ничего не найдено</p>
                <p className="text-xs text-[#5A5D7F] mt-1">Попробуйте смягчить ценовой диапазон или сбросить фильтры.</p>
              </div>
              <button
                onClick={handleResetFilters}
                className="mt-3 px-4 py-2 bg-[#1472F5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all"
              >
                Сбросить фильтры
              </button>
            </div>
          )}

          {/* Load More Button */}
          {sortedSkins.length > visibleCount && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="px-6 py-3 bg-[#1C1D2A] hover:bg-white/[0.06] text-white hover:text-[#1472F5] font-semibold text-xs rounded-xl border border-white/[0.04] transition-all"
              >
                Загрузить ещё (+24 скина)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-over Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />
          {/* Drawer content panel */}
          <div className="relative w-full max-w-[340px] h-full bg-[#13141C] border-l border-white/[0.08] flex flex-col p-5 overflow-y-auto animate-in slide-in-from-right duration-250 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
              <div className="text-[14px] font-bold text-white uppercase tracking-wider">
                Фильтры
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8E92BC] hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <FilterSidebar
              subQuery={subQuery}
              setSubQuery={setSubQuery}
              searchInDescription={searchInDescription}
              setSearchInDescription={setSearchInDescription}
              selectedWeapons={selectedWeapons}
              setSelectedWeapons={setSelectedWeapons}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              currency={currency}
              exchangeRate={exchangeRate}
              onReset={handleResetFilters}
              onQuickGloveToggle={handleQuickGloveToggle}
            />

            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="mt-6 w-full py-3 bg-[#1472F5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all text-center"
            >
              Применить ({sortedSkins.length} скинов)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
