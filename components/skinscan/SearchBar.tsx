'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { getSteamCdnUrl } from '@/lib/skinscan/utils'

interface SearchResult {
  name: string
  nameRu: string
  iconUrl: string
  category: string
}

interface Props {
  onSelect: (name: string) => void
  initialValue?: string
}

export function SearchBar({ onSelect, initialValue = '' }: Props) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/skinscan/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div ref={dropdownRef} className="relative w-full z-30">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Введите название скина на русском или английском (например: азимов, Dragon Lore)..."
          className="w-full h-12 pl-12 pr-10 bg-[#161721] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-500 focus:border-accent outline-none transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setShowDropdown(false)
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#161721] border border-white/[0.08] rounded-xl shadow-[0_10px_45px_rgba(0,0,0,0.5)] overflow-hidden z-40 max-h-[350px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-4 text-slate-400 text-[13px] gap-2">
              <Loader2 size={14} className="animate-spin text-accent" />
              <span>Поиск скинов…</span>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="text-center py-4 text-slate-500 text-[13px]">Ничего не найдено</div>
          )}
          {!loading && results.map((item) => {
            const imgUrl = getSteamCdnUrl(item.iconUrl)
            return (
              <button
                key={item.name}
                onClick={() => {
                  setQuery(item.nameRu)
                  onSelect(item.name)
                  setShowDropdown(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] border-b border-white/[0.03] last:border-0 transition-colors"
              >
                {/* Skin Thumbnail */}
                <div className="relative w-12 h-9 bg-black/40 rounded overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={imgUrl}
                    alt={item.name}
                    className="w-10 h-7 object-contain opacity-95"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                  />
                </div>

                {/* Skin Names */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-white truncate">
                    {item.nameRu}
                  </div>
                  <div className="text-[11px] text-[#8E92BC] truncate">
                    {item.name}
                  </div>
                </div>

                {/* Category Badge */}
                <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-[#8E92BC] text-[9px] font-bold uppercase tracking-wider shrink-0">
                  {item.category}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
