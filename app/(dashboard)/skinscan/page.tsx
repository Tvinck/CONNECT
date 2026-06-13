'use client'

/**
 * app/(dashboard)/skinscan/page.tsx — Главная страница СкинСкан.
 * Премиальный дизайн с Hero-баннером, интерактивными категориями, пагинацией и улучшенной анимацией.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/skinscan/SearchBar'
import { SkinCard } from '@/components/skinscan/SkinCard'
import { SKIN_DATABASE } from '@/lib/skinscan/skinDatabase'
import { getSteamCdnUrl } from '@/lib/skinscan/utils'
import { Flame, Star, Sparkles, Trophy, ShieldAlert } from 'lucide-react'

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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [visibleCount, setVisibleCount] = useState(30)
  const [exchangeRate, setExchangeRate] = useState<number>(92.5)

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

  // Filter skins by category
  const filteredSkins = selectedCategory === 'all'
    ? SKIN_DATABASE
    : SKIN_DATABASE.filter(skin => skin.category === selectedCategory)

  // Reset pagination when category changes
  useEffect(() => {
    setVisibleCount(30)
  }, [selectedCategory])

  const displayedSkins = filteredSkins.slice(0, visibleCount)

  // Top 3 featured skins for the premium hero highlight
  const featuredSkins = SKIN_DATABASE.filter(skin => 
    ['★ Karambit | Fade', 'AWP | Dragon Lore', 'AK-47 | Redline'].includes(skin.name)
  )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1C1D2A] via-[#151622] to-[#1C1D2A] border border-white/[0.05] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#BFF128]/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5c6dfb]/[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/[0.08] text-accent text-[11px] font-bold uppercase tracking-wider mb-4 border border-accent/[0.15]">
            <Flame size={12} className="animate-pulse" /> Live Price Aggregator
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Сравнивайте цены на скины <br className="hidden md:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#C7FA3B]">CS2 в реальном времени</span>
          </h1>
          <p className="text-[#8E92BC] text-sm md:text-[15px] mt-4 leading-relaxed max-w-xl">
            Поиск по 980+ популярным скинам на русском и английском языках. Сравнивайте предложения с 18 площадок, находите лучшие варианты и выгодно конвертируйте в рубли.
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 md:gap-10 mt-8 pt-6 border-t border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#BFF128]/[0.06] rounded-xl text-accent border border-[#BFF128]/[0.1]">
                <Trophy size={18} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">980+</div>
                <div className="text-[10px] text-[#5A5D7F] uppercase font-bold tracking-wider">Скинов в базе</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/[0.06] rounded-xl text-purple-400 border border-purple-500/[0.1]">
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

      {/* Search Container */}
      <div className="bg-[#1C1D2A] border border-white/[0.04] p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <SearchBar onSelect={handleSelect} />
      </div>

      {/* Featured Highlight row */}
      {selectedCategory === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <h2 className="text-[13px] uppercase tracking-wider text-[#5A5D7F] font-bold">
              Популярные хайлайты
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredSkins.map((skin) => (
              <div 
                key={skin.name}
                onClick={() => handleSelect(skin.name)}
                className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C1D2A] to-[#13141C] border border-white/[0.05] p-5 hover:border-accent/40 transition-all flex items-center justify-between"
              >
                {/* Glowing Background Glow */}
                <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-accent/[0.03] rounded-full blur-xl group-hover:bg-accent/[0.08] transition-all" />
                
                <div className="space-y-1 z-10 flex-1 min-w-0 pr-2">
                  <div className="px-1.5 py-0.5 rounded bg-accent/[0.08] text-accent text-[9px] font-bold uppercase tracking-wider inline-block">
                    Трендовый скин
                  </div>
                  <h3 className="text-white font-bold text-[14px] truncate mt-1.5">
                    {skin.nameRu}
                  </h3>
                  <p className="text-[#8E92BC] text-[11px] truncate">
                    {skin.name}
                  </p>
                </div>
                
                {/* Image */}
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

      {/* Main Catalog Section */}
      <div className="space-y-5">
        {/* Categories Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/[0.04] pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-accent text-[#0d0e12] font-bold border-accent shadow-[0_0_15px_rgba(191,241,40,0.25)]'
                  : 'bg-[#1C1D2A] text-[#8E92BC] hover:text-white border-white/[0.02] hover:bg-white/[0.01]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-[13px] uppercase tracking-wider text-[#5A5D7F] font-bold flex items-center gap-1.5">
            <span>Каталог скинов</span>
            <span className="text-xs text-[#8E92BC] font-normal lowercase">({filteredSkins.length} позиций)</span>
          </h2>
        </div>

        {/* Grid of Skin Cards */}
        {displayedSkins.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedSkins.map((skin) => (
              <SkinCard
                key={skin.name}
                name={skin.name}
                nameRu={skin.nameRu}
                iconUrl={skin.iconUrl}
                onClick={() => handleSelect(skin.name)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#1C1D2A] border border-white/[0.04] rounded-2xl p-12 text-center text-[#8E92BC]">
            Нет скинов в данной категории.
          </div>
        )}

        {/* Load More Button */}
        {filteredSkins.length > visibleCount && (
          <div className="flex justify-center pt-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + 30)}
              className="px-6 py-3 bg-[#1C1D2A] hover:bg-white/[0.06] text-white hover:text-accent font-semibold text-xs rounded-xl border border-white/[0.04] transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            >
              Загрузить ещё (+30 скинов)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
