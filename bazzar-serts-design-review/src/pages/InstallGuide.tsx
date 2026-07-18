import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Smartphone, Download, Settings, ArrowRight, MonitorSmartphone, Globe, Key, Lightbulb } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   InstallGuide — Инструкция по установке
   ═══════════════════════════════════════════════════════════ */

export function InstallGuide() {
  const { t } = useI18n()
  usePageTitle(t('guide.title'))

  const SECTIONS = [
    {
      id: 'udid',
      icon: <Smartphone size={24} />,
      color: '#3b82f6',
      title: t('guide.s1.title'),
      steps: [1, 2, 3, 4, 5, 6].map(n => t(`guide.s1.${n}`)),
    },
    {
      id: 'buy',
      icon: <Key size={24} />,
      color: '#9533ff',
      title: t('guide.s2.title'),
      steps: [1, 2, 3, 4, 5].map(n => t(`guide.s2.${n}`)),
    },
    {
      id: 'install',
      icon: <Download size={24} />,
      color: '#22c55e',
      title: t('guide.s3.title'),
      steps: [1, 2, 3, 4, 5].map(n => t(`guide.s3.${n}`)),
    },
    {
      id: 'use',
      icon: <MonitorSmartphone size={24} />,
      color: '#f59e0b',
      title: t('guide.s4.title'),
      steps: [1, 2, 3, 4, 5].map(n => t(`guide.s4.${n}`)),
    },
  ]

  const TIPS = [
    { icon: <Globe size={16} />, text: t('guide.tip1') },
    { icon: <Settings size={16} />, text: t('guide.tip2') },
    { icon: <Smartphone size={16} />, text: t('guide.tip3') },
  ]

  return (
    <section className="section" style={{ paddingTop: 'clamp(100px, 14vw, 140px)' }}>
      <div className="container" style={{ maxWidth: 780 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Заголовок */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-10)' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 12 }}>
              {t('guide.title')}
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
              {t('guide.subtitle')}
            </p>
          </div>

          {/* Секции */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            {SECTIONS.map((section, si) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: si * 0.08 }}
                className="card"
                style={{ padding: 'var(--sp-6)', overflow: 'hidden' }}
              >
                {/* Заголовок секции */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 'var(--sp-5)' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--r-lg)', flexShrink: 0,
                    background: `${section.color}12`, border: `1px solid ${section.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: section.color,
                  }}>
                    {section.icon}
                  </div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{section.title}</h2>
                </div>

                {/* Шаги */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 8 }}>
                  {section.steps.map((step, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      padding: '12px 0',
                      borderBottom: i < section.steps.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: `${section.color}15`, border: `1px solid ${section.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700, color: section.color,
                      }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6, paddingTop: 2 }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Советы */}
          <div className="card" style={{ padding: 'var(--sp-5)', marginTop: 'var(--sp-6)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 14 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Lightbulb size={18} style={{ color: '#f59e0b' }} /> {t('guide.tips')}</span></h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TIPS.map(tip => (
                <div key={tip.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{tip.icon}</span>
                  {tip.text}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 'var(--sp-8)' }}>
            <Link to="/catalog" className="btn btn-gradient" style={{ padding: '16px 36px', fontSize: '1rem', gap: 8 }}>
              {t('guide.cta')} <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
