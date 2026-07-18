import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   404 — Страница не найдена
   ═══════════════════════════════════════════════════════════ */

export function NotFound() {
  const { t } = useI18n()
  usePageTitle(t('notfound.title'))
  return (
    <section className="section" style={{ paddingTop: 'clamp(120px, 16vw, 180px)', paddingBottom: 'clamp(80px, 12vw, 140px)' }}>
      <div className="container" style={{ textAlign: 'center', maxWidth: 520 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Большая 404 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(5rem, 15vw, 10rem)',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              lineHeight: 1,
              background: 'var(--gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 16,
              letterSpacing: '-0.06em',
            }}
          >
            404
          </motion.div>

          <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', marginBottom: 12 }}>
            {t('notfound.title')}
          </h2>
          <p style={{
            color: 'var(--text-3)', fontSize: '0.92rem', lineHeight: 1.6,
            marginBottom: 32, maxWidth: 380, margin: '0 auto 32px',
          }}>
            {t('notfound.desc')}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-gradient" style={{ gap: 8 }}>
              <Home size={18} />
              {t('notfound.home')}
            </Link>
            <Link to="/catalog" className="btn btn-ghost" style={{ gap: 8 }}>
              <Search size={18} />
              {t('notfound.catalog')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
