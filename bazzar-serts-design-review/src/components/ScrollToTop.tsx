import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   ScrollToTop — Кнопка «Наверх» (стиль BuildStore)
   Появляется при скролле вниз, плавный подъём
   ═══════════════════════════════════════════════════════════ */

export function ScrollToTop() {
  const { t } = useI18n()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('general.toTop')}
          style={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 90,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(149, 51, 255, 0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(149,51,255,0.3), 0 0 0 1px rgba(149,51,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(149,51,255,0.5), 0 0 0 1px rgba(149,51,255,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(149,51,255,0.3), 0 0 0 1px rgba(149,51,255,0.2)'
          }}
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
