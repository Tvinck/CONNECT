import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'

export type LegalType = 'terms' | 'privacy' | 'disclaimer' | null

interface LegalModalProps {
  type: LegalType
  onClose: () => void
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  const { t } = useI18n()
  if (!type) return null

  const hStyle = { marginTop: '1.5em', marginBottom: '0.5em', color: 'var(--text)' } as const

  const content = {
    terms: {
      title: t('legal.terms.title'),
      body: (
        <>
          <p>{t('legal.terms.p1')}</p>
          <p>{t('legal.terms.p2')}</p>
          <h4 style={hStyle}>{t('legal.terms.h1')}</h4>
          <p>{t('legal.terms.p3')}</p>
          <h4 style={hStyle}>{t('legal.terms.h2')}</h4>
          <p>{t('legal.terms.p4')}</p>
          <h4 style={hStyle}>{t('legal.terms.h3')}</h4>
          <p>{t('legal.terms.p5')}</p>
        </>
      )
    },
    privacy: {
      title: t('legal.privacy.title'),
      body: (
        <>
          <p>{t('legal.privacy.p1')}</p>
          <h4 style={hStyle}>{t('legal.privacy.h1')}</h4>
          <p>{t('legal.privacy.p2')}</p>
          <h4 style={hStyle}>{t('legal.privacy.h2')}</h4>
          <p>{t('legal.privacy.p3')}</p>
          <h4 style={hStyle}>{t('legal.privacy.h3')}</h4>
          <p>{t('legal.privacy.p4')}</p>
        </>
      )
    },
    disclaimer: {
      title: t('legal.disclaimer.title'),
      body: (
        <>
          <p>{t('legal.disclaimer.p1')}</p>
          <h4 style={hStyle}>{t('legal.disclaimer.h1')}</h4>
          <p>{t('legal.disclaimer.p2')}</p>
          <h4 style={hStyle}>{t('legal.disclaimer.h2')}</h4>
          <p>{t('legal.disclaimer.p3')}</p>
          <h4 style={hStyle}>{t('legal.disclaimer.h3')}</h4>
          <p>{t('legal.disclaimer.p4')}</p>
        </>
      )
    }
  }

  const data = content[type]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="card"
          style={{
            width: '100%', maxWidth: 600,
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            background: 'var(--bg)', border: '1px solid var(--hair)',
            boxShadow: '0 24px 50px rgba(0,0,0,0.5)', borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--hair)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{data.title}</h2>
            <button onClick={onClose} className="btn btn-ghost" style={{ width: 36, height: 36, padding: 0 }} aria-label={t('legal.close')}>
              <X size={20} />
            </button>
          </div>

          <div className="legal-content" style={{ padding: 24, overflowY: 'auto', color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {data.body}
          </div>

          <div style={{ padding: 16, borderTop: '1px solid var(--hair)', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface-2)', borderBottomLeftRadius: 'inherit', borderBottomRightRadius: 'inherit' }}>
            <button onClick={onClose} className="btn btn-primary" style={{ padding: '0 24px', height: 44 }}>
              {t('legal.ok')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
