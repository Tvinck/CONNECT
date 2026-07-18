import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Star, ArrowRight, Shield, Zap, Headphones, CreditCard, Check, Smartphone, Tablet, Music } from 'lucide-react'
import { products, categories, reviews, faqs } from '../data/catalog'
import { ProductCard } from '../components/ProductCard'
import { DynamicIcon } from '../components/DynamicIcon'
import { SkeletonCard } from '../components/Skeleton'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Home — Чистый тёмный минимализм (стиль Игромир)
   ═══════════════════════════════════════════════════════════ */


export function Home() {
  usePageTitle()
  const { t, l } = useI18n()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const navigate = useNavigate()

  const POPULAR_TAGS = [t('tag.vip'), t('tag.tiktok'), t('tag.scarlet'), t('tag.free'), t('tag.vksova')]

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          HERO — Animated gradient mesh background
          ══════════════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(100px, 14vw, 160px) 0 clamp(48px, 8vw, 80px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated gradient blobs */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <motion.div
            animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.15, 0.9, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '-20%', left: '-10%',
              width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(149,51,255,0.12) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <motion.div
            animate={{ x: [0, -40, 30, 0], y: [0, 30, -30, 0], scale: [1, 0.85, 1.1, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '10%', right: '-15%',
              width: '45vw', height: '45vw', maxWidth: 500, maxHeight: 500,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(110,0,229,0.1) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <motion.div
            animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', bottom: '-10%', left: '30%',
              width: '35vw', height: '35vw', maxWidth: 400, maxHeight: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,162,224,0.07) 0%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />
        </div>

        <div className="container" style={{ textAlign: 'center', maxWidth: 800, position: 'relative', zIndex: 1 }}>
          {/* Kicker badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 20 }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 'var(--r-full)',
              background: 'rgba(149,51,255,0.1)', border: '1px solid rgba(149,51,255,0.2)',
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)',
            }}>
              {t('hero.badge')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}
          >
            {t('hero.title1')} <span className="text-accent">{t('hero.title2')}</span>
            <br />{t('hero.title3')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 'clamp(0.92rem, 2vw, 1.1rem)',
              color: 'var(--text-2)',
              lineHeight: 1.7,
              maxWidth: 520,
              margin: '0 auto 32px',
            }}
          >
            {t('hero.subtitleFull')}
          </motion.p>

          {/* Поиск */}
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            style={{ position: 'relative', maxWidth: 560, margin: '0 auto 24px' }}
          >
            <Search size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              className="field"
              type="text"
              placeholder={t('hero.searchHome')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: 48, paddingRight: 120, height: 56,
                borderRadius: 'var(--r-xl)', fontSize: '0.95rem',
                background: 'rgba(34,34,34,0.8)', backdropFilter: 'blur(10px)',
              }}
            />
            <button
              type="submit"
              className="btn btn-gradient"
              style={{
                position: 'absolute', right: 6, top: 6, bottom: 6,
                padding: '0 24px', borderRadius: 'var(--r-lg)', fontSize: '0.88rem',
              }}
            >
              {t('hero.cta')}
            </button>
          </motion.form>

          {/* Теги */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}
          >
            {POPULAR_TAGS.map((tag) => (
              <Link key={tag} to={`/catalog?q=${encodeURIComponent(tag)}`} className="chip">{tag}</Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Trust Bar ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 'clamp(16px, 4vw, 48px)',
        padding: '20px 16px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}>
        {[
          { icon: <Zap size={18} />, text: t('trust.delivery') },
          { icon: <Shield size={18} />, text: t('trust.guarantee') },
          { icon: <Headphones size={18} />, text: t('trust.support') },
          { icon: <CreditCard size={18} />, text: t('trust.payment') },
        ].map(item => (
          <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* ── MARQUEE — Бесконечная карусель приложений ──────── */}
      <div className="marquee-container">
        <div className="marquee-track">
          {[...Array(2)].map((_, setIdx) => (
            [{name: 'TikTok', color: '#ff0050', gradient: 'linear-gradient(135deg, #ff0050, #00f2ea)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.1v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.28 8.28 0 004.76 1.5v-3.5a4.85 4.85 0 01-1-.04z" fill="currentColor"/></svg>},
             {name: 'YouTube Premium', color: '#ff0000', gradient: 'linear-gradient(135deg, #ff0000, #cc0000)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.87.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.55 15.57V8.43L15.8 12l-6.25 3.57z" fill="currentColor"/></svg>},
             {name: 'Spotify++', color: '#1db954', gradient: 'linear-gradient(135deg, #1db954, #1ed760)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.7 1.32.42.18.48.66.24 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-.96-.12-1.08-.6-.12-.48.12-.96.6-1.08 4.38-1.32 9.78-.66 13.5 1.62.36.18.48.78.18 1.14zm.12-3.36C15.24 8.4 8.88 8.16 5.16 9.3c-.6.18-1.14-.18-1.32-.72-.18-.6.18-1.14.72-1.32 4.26-1.26 11.34-1.02 15.84 1.5.54.3.72 1.02.42 1.56-.3.42-.96.6-1.5.36h-.24z" fill="currentColor"/></svg>},
             {name: 'Instagram Rocket', color: '#e1306c', gradient: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85 0-3.2.01-3.58.07-4.85C2.38 3.86 3.9 2.31 7.15 2.23 8.42 2.18 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" fill="currentColor"/></svg>},
             {name: 'Scarlet', color: '#ff3b30', gradient: 'linear-gradient(135deg, #ff3b30, #ff6259)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>},
             {name: 'ESign', color: '#007aff', gradient: 'linear-gradient(135deg, #007aff, #5856d6)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>},
             {name: 'GBox', color: '#34c759', gradient: 'linear-gradient(135deg, #34c759, #30d158)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>},
             {name: 'Delta Emulator', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 2L2 19.5h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="12" cy="14" r="2" fill="currentColor"/></svg>},
             {name: 'VK Сова', color: '#0077ff', gradient: 'linear-gradient(135deg, #0077ff, #0055dd)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 13.6c-.4.56-1.16.88-2.04.88-.6 0-1.12-.16-1.56-.44-.32-.2-.6-.48-.84-.8-.24.32-.52.6-.84.8-.44.28-.96.44-1.56.44-.88 0-1.64-.32-2.04-.88-.32-.44-.48-.96-.48-1.6V9h1.6v5c0 .32.08.56.2.72.16.2.4.28.72.28.52 0 .88-.24 1.12-.64.2-.32.28-.72.28-1.16V9h1.6v4.2c0 .44.08.84.28 1.16.24.4.6.64 1.12.64.32 0 .56-.08.72-.28.12-.16.2-.4.2-.72V9h1.6v5c0 .64-.16 1.16-.48 1.6z" fill="currentColor"/></svg>},
             {name: 'Telegram Premium', color: '#0088cc', gradient: 'linear-gradient(135deg, #0088cc, #229ed9)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M22.27 2.04L1.42 10.3c-1.42.57-1.41 1.36-.26 1.71l5.33 1.66 12.37-7.8c.58-.36 1.12-.17.68.22l-10 9.04h-.01l-.37 5.55c.54 0 .78-.25 1.08-.54l2.6-2.52 5.4 3.99c1 .55 1.72.27 1.97-.92L23.9 3.54c.36-1.47-.56-2.14-1.63-1.5z" fill="currentColor"/></svg>},
             {name: 'X / Twitter', color: '#000', gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.57-6.63 7.57H.49l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.3 19.5h2.04L6.49 3.24H4.3L17.6 20.65z" fill="currentColor"/></svg>},
             {name: 'Netflix', color: '#e50914', gradient: 'linear-gradient(135deg, #e50914, #b81d24)',
              svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M5.4 0L9.6 16.2 13.8 0h4.8L12 24h-1.2L4.2 5.4V24H0V0h5.4zM18.6 0v18.6L14.4 7.8V0h4.2zM24 0v24h-5.4L24 0z" fill="currentColor"/></svg>},
            ].map((app, i) => (
              <div key={`${setIdx}-${i}`} className="marquee-item" style={{ '--app-color': app.color, '--app-gradient': app.gradient } as React.CSSProperties}>
                <div className="marquee-icon">
                  {app.svg}
                </div>
                <span>{app.name}</span>
              </div>
            ))
          ))}
        </div>
      </div>

      {/* ── КАТЕГОРИИ ─────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t('cat.title')}</h2>
            <Link to="/catalog" className="btn btn-ghost" style={{ fontSize: '0.82rem', gap: 4 }}>
              {t('general.all')} <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--sp-4)',
          }}>
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link to={`/catalog?category=${cat.id}`}>
                  <div className="card card-hover" style={{
                    padding: 'var(--sp-5) var(--sp-6)',
                    display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer',
                  }}>
                    {/* Цветная SVG иконка */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 'var(--r-md)',
                      background: `${cat.color}15`,
                      border: `1px solid ${cat.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <DynamicIcon name={cat.icon} size={24} style={{ color: cat.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 3, color: '#fff' }}>{l(cat.title)}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{l(cat.subtitle)}</p>
                    </div>
                    <div style={{
                      fontSize: '0.78rem', fontWeight: 700, color: cat.color,
                      background: `${cat.color}12`,
                      padding: '5px 12px', borderRadius: 'var(--r-full)',
                    }}>
                      {cat.count}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ХИТЫ ПРОДАЖ ───────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>{t('home.popular')}</h2>
          </div>

          <div className="grid-products">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : products.slice(0, 4).map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))
            }
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--sp-8)' }}>
            <Link to="/catalog" className="btn btn-gradient" style={{ padding: '14px 32px', gap: 6 }}>
              {t('home.wholeCatalog')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ПРЕИМУЩЕСТВА ───────────────────────────────────── */}
      <section id="why" className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>{t('home.why')}</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--sp-4)',
          }}>
            {[
              { icon: <Zap size={24} />, title: t('home.why.instant'), desc: t('home.why.instantDesc') },
              { icon: <Shield size={24} />, title: t('home.why.warranty'), desc: t('home.why.warrantyDesc') },
              { icon: <Headphones size={24} />, title: t('home.why.support'), desc: t('home.why.supportDesc') },
              { icon: <Star size={24} />, title: t('home.why.rating'), desc: t('home.why.ratingDesc') },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card"
                style={{
                  padding: 'var(--sp-6)',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}
              >
                <div style={{ color: 'var(--accent)' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{item.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ОТЗЫВЫ ─────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t('home.reviews')}</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--sp-4)',
          }}>
            {reviews.slice(0, 4).map((review, i) => (
              <motion.div
                key={review.id}
                className="card"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                style={{
                  padding: 'var(--sp-6)',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} fill={s <= review.rating ? '#fcab14' : 'transparent'} stroke={s <= review.rating ? '#fcab14' : 'var(--text-3)'} />
                  ))}
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6, flex: 1 }}>
                  «{l(review.text)}»
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.82rem', color: '#fff',
                  }}>
                    {l(review.avatar)}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{l(review.name)}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Check size={10} style={{ color: 'var(--success)' }} />
                      {l(review.date)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="container" style={{ maxWidth: 780 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>{t('home.faq')}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="card"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              >
                <div style={{
                  padding: '18px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: openFaq === faq.id ? 'var(--accent)' : 'var(--text)' }}>
                    {l(faq.question)}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0, color: 'var(--text-3)' }}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {openFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{
                        padding: '0 24px 18px',
                        fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.7,
                      }}>
                        {l(faq.answer)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── СОВМЕСТИМОСТЬ iOS ──────────────────────────────── */}
      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 'var(--r-full)',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              fontSize: '0.78rem', fontWeight: 700, color: '#22c55e',
              marginBottom: 16,
            }}>
              <Smartphone size={14} />
              {t('home.compat.badge')}
            </div>
            <h2 style={{ marginBottom: 8 }}>
              {t('home.compat.title1')} <span className="text-accent">{t('home.compat.title2')}</span>
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', marginBottom: 28 }}>
              {t('home.compat.subtitle')}
            </p>

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 10,
              justifyContent: 'center',
            }}>
              {[
                { ver: 'iOS 15', ok: true },
                { ver: 'iOS 16', ok: true },
                { ver: 'iOS 17', ok: true },
                { ver: 'iOS 18', ok: true },
                { ver: 'iOS 18.5', ok: true },
                { ver: 'iPadOS 16', ok: true },
                { ver: 'iPadOS 17', ok: true },
                { ver: 'iPadOS 18', ok: true },
              ].map(item => (
                <span key={item.ver} className={`compat-chip ${item.ok ? 'supported' : 'partial'}`}>
                  {item.ok ? <Check size={13} /> : '⚠'}
                  {item.ver}
                </span>
              ))}
            </div>

            <div style={{
              marginTop: 20,
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}>
              {[
                { label: 'iPhone', models: '8 / X / 11 / 12 / 13 / 14 / 15 / 16', icon: <Smartphone size={22} style={{ color: 'var(--accent)' }} /> },
                { label: 'iPad', models: t('home.compat.ipad'), icon: <Tablet size={22} style={{ color: '#06b6d4' }} /> },
                { label: 'iPod touch', models: t('home.compat.ipod'), icon: <Music size={22} style={{ color: '#f59e0b' }} /> },
              ].map(d => (
                <div key={d.label} className="card" style={{
                  padding: '16px', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {d.icon}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{d.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3 }}>{d.models}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section id="cta" className="section">
        <div className="container" style={{ textAlign: 'center', maxWidth: 600 }}>
          <h2 style={{ marginBottom: 12 }}>
            {t('cta.title')} <span className="text-accent">{t('cta.accent')}</span>?
          </h2>
          <p style={{ color: 'var(--text-2)', marginBottom: 28, fontSize: '0.95rem', lineHeight: 1.6 }}>
            {t('cta.subtitle')}
          </p>
          <Link to="/catalog" className="btn btn-gradient" style={{ padding: '16px 40px', fontSize: '1rem' }}>
            {t('cta.button')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}
