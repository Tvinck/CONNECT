import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Privacy — Политика конфиденциальности
   ═══════════════════════════════════════════════════════════ */

const SECTION_COUNTS: [string, number][] = [
  ['privacy.s1', 3],
  ['privacy.s2', 3],
  ['privacy.s3', 4],
  ['privacy.s4', 3],
  ['privacy.s5', 3],
  ['privacy.s6', 3],
]

export function Privacy() {
  const { t } = useI18n()
  usePageTitle(t('privacy.title'))

  const SECTIONS = SECTION_COUNTS.map(([base, count]) => ({
    title: t(`${base}.title`),
    items: Array.from({ length: count }, (_, i) => t(`${base}.${i + 1}`)),
  }))

  return (
    <section className="section" style={{ paddingTop: 'clamp(100px, 14vw, 140px)' }}>
      <div className="container" style={{ maxWidth: 780 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Заголовок */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-10)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--r-xl)',
              background: 'rgba(149,51,255,0.1)', border: '1px solid rgba(149,51,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Lock size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 12 }}>
              {t('privacy.title')}
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
              {t('privacy.subtitle')}
            </p>
          </div>

          {/* Секции */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {SECTIONS.map((section, si) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: si * 0.05 }}
                className="card"
                style={{ padding: 'var(--sp-6)' }}
              >
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>
                  {section.title}
                </h2>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 0, listStyle: 'none' }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{
                      fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.7,
                      paddingLeft: 20, position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute', left: 0, top: 9,
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--accent)',
                      }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Кнопка */}
          <div style={{ textAlign: 'center', marginTop: 'var(--sp-8)' }}>
            <Link to="/" className="btn btn-ghost" style={{ gap: 6 }}>
              {t('privacy.home')} <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
