import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, User, Home, ShoppingBag, Globe } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Header — Floating pill-навигация (стиль batvai)
   Парящее меню по центру экрана
   ═══════════════════════════════════════════════════════════ */

export function Header() {
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, setLang, t } = useI18n()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(query.trim())}`)
      setShowSearch(false)
      setQuery('')
    }
  }

  const isActive = (path: string) => location.pathname === path

  const NAV = [
    { to: '/', label: t('nav.home'), icon: <Home size={16} /> },
    { to: '/catalog', label: t('nav.catalog'), icon: <ShoppingBag size={16} /> },
    { to: '/cabinet', label: t('nav.cabinet'), icon: <User size={16} /> },
  ]

  return (
    <header style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      width: 'auto',
      maxWidth: 'calc(100% - 32px)',
    }}>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          borderRadius: 'var(--r-full)',
          background: 'rgba(20, 20, 20, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Лого */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'baseline',
          padding: '0 14px 0 10px', flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem', fontWeight: 800, color: '#fff',
            letterSpacing: '-0.04em',
          }}>BAZZAR</span>
          <span style={{
            fontWeight: 500, fontSize: '0.85rem', color: 'var(--accent)',
            marginLeft: 3, fontStyle: 'italic',
          }}>certs.</span>
        </Link>

        {/* Nav pills */}
        <nav style={{ display: 'flex', gap: 2 }}>
          {NAV.map(item => {
            const active = isActive(item.to)
            return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--r-full)',
                fontSize: '0.82rem', fontWeight: 600,
                color: active ? '#fff' : 'var(--text-3)',
                background: active ? 'rgba(149,51,255,0.2)' : 'transparent',
                transition: 'all 200ms',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = '#fff'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text-3)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ color: active ? 'var(--accent)' : 'inherit' }}>{item.icon}</span>
              <span className="mobile-hide">{item.label}</span>
            </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

        {/* Lang Toggle */}
        <button
          onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
          title={t('header.langTitle')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 'var(--r-full)',
            color: 'var(--text-2)', fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.04em', transition: 'all 200ms',
            background: 'rgba(149,51,255,0.06)',
            border: '1px solid rgba(149,51,255,0.15)',
            cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(149,51,255,0.15)'
            e.currentTarget.style.color = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(149,51,255,0.06)'
            e.currentTarget.style.color = 'var(--text-2)'
          }}
        >
          <Globe size={12} />
          {lang === 'ru' ? 'EN' : 'RU'}
        </button>

        {/* Search */}
        <AnimatePresence>
          {showSearch ? (
            <motion.form
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 180, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSearch}
              style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}
            >
              <input
                type="text"
                placeholder={t('header.search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%', height: 32, padding: '0 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--r-full)',
                  color: '#fff', fontSize: '0.82rem',
                  outline: 'none', fontFamily: 'var(--font-body)',
                }}
              />
              <button type="button" onClick={() => { setShowSearch(false); setQuery('') }}
                style={{ color: 'var(--text-3)', padding: '4px 6px', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </motion.form>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: '50%',
                color: 'var(--text-3)', transition: 'color 200ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
            >
              <Search size={16} />
            </button>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  )
}
