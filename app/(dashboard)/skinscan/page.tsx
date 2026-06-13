'use client'

/**
 * app/(dashboard)/skinscan/page.tsx — Главная страница СкинСкан.
 * Содержит поиск, фильтры и сетку карточек найденных скинов.
 *
 * Взаимодействие:
 *  - Поиск через SearchBar (onSelect) открывает детали скина (router.push).
 *  - Фильтры управляют состоянием, но фильтрация пока применяется клиент‑сайдом к результатам.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/skinscan/SearchBar'
import { FilterPanel, type FilterState } from '@/components/skinscan/FilterPanel'
import { SkinCard } from '@/components/skinscan/SkinCard'

export default function SkinScanHome() {
  const router = useRouter()
  const [filters, setFilters] = useState<FilterState>({
    exterior: '',
    stattrak: 'all',
    souvenir: 'all',
    minPrice: '',
    maxPrice: '',
  })
  const [results, setResults] = useState<string[]>([])

  const handleSelect = (name: string) => {
    // переходим к деталям скина
    const slug = encodeURIComponent(name)
    router.push(`/skinscan/${slug}`)
  }

  // Simple client‑side filter for demo – in real app we'd request filtered results from API
  const applyFilters = (list: string[]) => {
    // placeholder – no actual filter logic yet, just returns list
    return list
  }

  // When component mounts, fetch a small static list of popular skins for demo purposes
  useEffect(() => {
    const popular = [
      'AK-47 | Redline (Field-Tested)',
      'AWP | Dragon Lore (Factory New)',
      'M4A4 | Howl (Minimal Wear)',
      'Desert Eagle | Blaze (Well-Worn)',
      'Glock-18 | Fade (Battle-Scarred)',
    ]
    setResults(popular)
  }, [])

  const displayed = applyFilters(results)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">СкинСкан (Beta)</h1>
      <SearchBar onSelect={handleSelect} />
      <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters({
        exterior: '',
        stattrak: 'all',
        souvenir: 'all',
        minPrice: '',
        maxPrice: '',
      })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-4">
        {displayed.map((name) => (
          <SkinCard key={name} name={name} iconUrl="" onClick={() => handleSelect(name)} />
        ))}
      </div>
    </div>
  )
}
