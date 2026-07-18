import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, SearchX } from 'lucide-react'
import { products } from '../data/catalog'
import { ProductCard } from '../components/ProductCard'
import { SkeletonCard } from '../components/Skeleton'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Catalog — Чистая страница каталога (стиль Игромир)
   ═══════════════════════════════════════════════════════════ */

const SORT_IDS = ['popular', 'priceUp', 'priceDown', 'rating'] as const

export function Catalog() {
  const { t, l } = useI18n()
  usePageTitle(t('catalog.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [sortBy, setSortBy] = useState<(typeof SORT_IDS)[number]>('popular')

  const CATS = [
    { id: 'all', label: t('cat.all') },
    { id: 'certs', label: t('cat.certs') },
    { id: 'apps', label: t('cat.apps') },
    { id: 'utils', label: t('cat.utils') },
    { id: 'free', label: t('cat.free') },
  ]

  const SORTS: { id: (typeof SORT_IDS)[number]; label: string }[] = [
    { id: 'popular', label: t('catalog.sort.popular') },
    { id: 'priceUp', label: t('catalog.sort.priceUp') },
    { id: 'priceDown', label: t('catalog.sort.priceDown') },
    { id: 'rating', label: t('catalog.sort.rating') },
  ]

  useEffect(() => {
    setLoading(true)
    const tm = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(tm)
  }, [category, query])

  const filtered = useMemo(() => {
    let result = [...products]

    if (query) {
      const q = query.toLowerCase()
      result = result.filter(p =>
        l(p.title).toLowerCase().includes(q) ||
        l(p.subtitle).toLowerCase().includes(q)
      )
    }
    if (category === 'free') result = result.filter(p => p.price === 0)
    else if (category !== 'all') result = result.filter(p => p.category === category)

    switch (sortBy) {
      case 'priceUp': result.sort((a, b) => a.price - b.price); break
      case 'priceDown': result.sort((a, b) => b.price - a.price); break
      case 'rating': result.sort((a, b) => b.rating - a.rating); break
    }

    return result
  }, [query, category, sortBy, l])

  const updateFilter = (cat: string) => {
    setCategory(cat)
    const params = new URLSearchParams(searchParams)
    if (cat === 'all') params.delete('category')
    else params.set('category', cat)
    setSearchParams(params)
  }

  return (
    <section className="section" style={{ paddingTop: 'clamp(80px, 10vw, 100px)' }}>
      <div className="container">
        {/* Заголовок + поиск */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap',
        }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)' }}>{t('catalog.title')}</h1>

          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              className="field"
              type="text"
              placeholder={t('catalog.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 40, height: 44, borderRadius: 'var(--r-md)', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* Фильтры */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button
                key={c.id}
                onClick={() => updateFilter(c.id)}
                className={`chip ${category === c.id ? 'active' : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as (typeof SORT_IDS)[number])}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '8px 32px 8px 14px',
                color: 'var(--text)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
              }}
            >
              {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <SlidersHorizontal size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }} />
          </div>
        </div>

        {/* Результаты */}
        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 'var(--sp-4)' }}>
          {t('catalog.foundCount', { count: filtered.length })}
        </p>

        {loading ? (
          <div className="grid-products">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: 'var(--sp-16) 0' }}
          >
            <SearchX size={48} style={{ color: 'var(--text-3)', margin: '0 auto' }} />
            <h3 style={{ marginTop: 16, color: 'var(--text-2)' }}>{t('catalog.nothing')}</h3>
            <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', marginTop: 8 }}>
              {t('catalog.nothingDesc')}
            </p>
          </motion.div>
        ) : (
          <div className="grid-products">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </section>
  )
}
