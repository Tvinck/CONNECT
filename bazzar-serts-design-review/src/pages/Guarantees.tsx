import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, RefreshCcw, Clock, CheckCircle, AlertTriangle, ArrowRight, Headphones } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Guarantees — Гарантии и возвраты
   ═══════════════════════════════════════════════════════════ */

export function Guarantees() {
  const { t } = useI18n()
  usePageTitle(t('guarantees.title'))

  const GUARANTEES = [
    { icon: <RefreshCcw size={24} />, color: '#22c55e', title: t('guarantees.g1.title'), desc: t('guarantees.g1.desc') },
    { icon: <Clock size={24} />, color: '#3b82f6', title: t('guarantees.g2.title'), desc: t('guarantees.g2.desc') },
    { icon: <Shield size={24} />, color: '#9533ff', title: t('guarantees.g3.title'), desc: t('guarantees.g3.desc') },
    { icon: <Headphones size={24} />, color: '#f59e0b', title: t('guarantees.g4.title'), desc: t('guarantees.g4.desc') },
  ]

  const REFUND_CASES = [
    { ok: true, text: t('guarantees.case1') },
    { ok: true, text: t('guarantees.case2') },
    { ok: true, text: t('guarantees.case3') },
    { ok: true, text: t('guarantees.case4') },
    { ok: false, text: t('guarantees.case5') },
    { ok: false, text: t('guarantees.case6') },
    { ok: false, text: t('guarantees.case7') },
  ]

  return (
    <section className="section" style={{ paddingTop: 'clamp(100px, 14vw, 140px)' }}>
      <div className="container" style={{ maxWidth: 780 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Заголовок */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-10)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--r-xl)',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Shield size={28} style={{ color: 'var(--success)' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 12 }}>
              {t('guarantees.title')}
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
              {t('guarantees.subtitle')}
            </p>
          </div>

          {/* Карточки гарантий */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--sp-4)',
            marginBottom: 'var(--sp-8)',
          }}>
            {GUARANTEES.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card"
                style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--r-lg)',
                  background: `${g.color}12`, border: `1px solid ${g.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: g.color,
                }}>
                  {g.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{g.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{g.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Условия */}
          <div className="card" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 'var(--sp-5)' }}>
              {t('guarantees.terms')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {REFUND_CASES.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 0',
                  borderBottom: i < REFUND_CASES.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: '0.88rem',
                }}>
                  {c.ok
                    ? <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    : <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  }
                  <span style={{ color: 'var(--text-2)' }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', marginBottom: 16 }}>
              {t('guarantees.ctaText')}
            </p>
            <Link to="/catalog" className="btn btn-gradient" style={{ padding: '16px 36px', fontSize: '1rem', gap: 8 }}>
              {t('how.cta')} <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
