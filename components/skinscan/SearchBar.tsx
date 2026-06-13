'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

interface Props {
  onSelect: (name: string) => void
  initialValue?: string
}

export function SearchBar({ onSelect, initialValue = '' }: Props) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<string[]>([])
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
          placeholder="Введите название скина (например: AK-47 | Redline)…"
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
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#161721] border border-white/[0.08] rounded-xl shadow-[0_10px_45px_rgba(0,0,0,0.5)] overflow-hidden z-40 max-h-[300px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-4 text-slate-400 text-[13px] gap-2">
              <Loader2 size={14} className="animate-spin text-accent" />
              <span>Поиск скинов…</span>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="text-center py-4 text-slate-500 text-[13px]">Ничего не найдено</div>
          )}
          {!loading && results.map((name) => (
            <button
              key={name}
              onClick={() => {
                setQuery(name)
                onSelect(name)
                setShowDropdown(false)
              }}
              className="w-full flex items-center px-4 py-3 text-left text-[13.5px] text-slate-200 hover:text-white hover:bg-white/[0.03] border-b border-white/[0.03] last:border-0 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
