import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Smartphone, ShieldCheck, Download, Zap, ArrowRight, CheckCircle } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   HowItWorks — Как это работает (3 шага)
   ═══════════════════════════════════════════════════════════ */

export function HowItWorks() {
  const { t } = useI18n()
  usePageTitle(t('how.title'))

  const STEPS = [
    {
      num: '01',
      icon: <Smartphone size={28} />,
      color: '#3b82f6',
      title: t('how.s1.title'),
      desc: t('how.s1.desc'),
      details: [t('how.s1.d1'), t('how.s1.d2'), t('how.s1.d3')],
    },
    {
      num: '02',
      icon: <ShieldCheck size={28} />,
      color: '#9533ff',
      title: t('how.s2.title'),
      desc: t('how.s2.desc'),
      details: [t('how.s2.d1'), t('how.s2.d2'), t('how.s2.d3')],
    },
    {
      num: '03',
      icon: <Download size={28} />,
      color: '#22c55e',
      title: t('how.s3.title'),
      desc: t('how.s3.desc'),
      details: [t('how.s3.d1'), t('how.s3.d2'), t('how.s3.d3')],
    },
  ]

  return (
    <section className="section" style={{ paddingTop: 'clamp(100px, 14vw, 140px)' }}>
      <div className="container" style={{ maxWidth: 780 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Заголовок */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-10)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 'var(--r-full)',
              background: 'rgba(149,51,255,0.1)', border: '1px solid rgba(149,51,255,0.2)',
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)',
              marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <Zap size={12} /> {t('how.badge')}
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 12 }}>
              {t('how.title')}
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
              {t('how.subtitle')}
            </p>
          </div>

          {/* Шаги */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
                style={{ padding: 'var(--sp-6)', position: 'relative', overflow: 'hidden' }}
              >
                {/* Номер фоном */}
                <div style={{
                  position: 'absolute', top: -10, right: 20,
                  fontSize: '6rem', fontWeight: 900, fontFamily: 'var(--font-display)',
                  color: `${step.color}08`, lineHeight: 1, pointerEvents: 'none',
                }}>{step.num}</div>

                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', position: 'relative' }}>
                  {/* Иконка */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--r-lg)', flexShrink: 0,
                    background: `${step.color}12`, border: `1px solid ${step.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: step.color,
                  }}>
                    {step.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 14 }}>
                      {step.desc}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {step.details.map(d => (
                        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-3)' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 'var(--sp-8)' }}>
            <Link to="/catalog" className="btn btn-gradient" style={{ padding: '16px 36px', fontSize: '1rem', gap: 8 }}>
              {t('how.cta')} <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
