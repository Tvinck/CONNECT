'use client'

/**
 * app/(dashboard)/skinscan/page.tsx — Главная страница СкинСкан.
 * Содержит поиск, категории, быстрые фильтры и сетку карточек популярных скинов.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/skinscan/SearchBar'
import { SkinCard } from '@/components/skinscan/SkinCard'
import { SKIN_DATABASE, type DbSkin } from '@/lib/skinscan/skinDatabase'

const CATEGORIES = [
  { id: 'all', name: 'Все скины' },
  { id: 'rifles', name: 'Автоматы' },
  { id: 'snipers', name: 'Винтовки' },
  { id: 'pistols', name: 'Пистолеты' },
  { id: 'knives', name: 'Ножи' },
  { id: 'gloves', name: 'Перчатки' },
]

export default function SkinScanHome() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const handleSelect = (name: string) => {
    const slug = encodeURIComponent(name)
    router.push(`/skinscan/${slug}`)
  }

  // Filter skins by category
  const filteredSkins = selectedCategory === 'all'
    ? SKIN_DATABASE
    : SKIN_DATABASE.filter(skin => skin.category === selectedCategory)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Title & Description */}
      <div>
        <h1 className="text-2xl font-bold text-white">СкинСкан (Beta)</h1>
        <p className="text-sm text-[#8E92BC] mt-1">
          Агрегатор цен на скины CS2 по 15+ торговым площадкам. Поиск на русском языке, конвертация в рубли.
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar onSelect={handleSelect} />

      {/* Categories Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.04] pb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              selectedCategory === cat.id
                ? 'bg-accent text-[#0d0e12] font-bold shadow-[0_0_15px_rgba(191,241,40,0.25)]'
                : 'bg-[#1C1D2A] text-[#8E92BC] hover:text-white border border-white/[0.02]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid of Skins */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[14px] uppercase tracking-wider text-[#5A5D7F] font-bold">
            Популярные скины ({filteredSkins.length})
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSkins.map((skin) => (
            <SkinCard
              key={skin.name}
              name={skin.name}
              nameRu={skin.nameRu}
              iconUrl={skin.iconUrl}
              onClick={() => handleSelect(skin.name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
