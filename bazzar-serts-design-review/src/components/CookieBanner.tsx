import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   CookieBanner — GDPR-совместимый баннер
   Показывается один раз, запоминает согласие в localStorage
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'bazzar_cookies_accepted'

export function CookieBanner() {
  const [show, setShow] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Показать через 1.5 сек после загрузки
        const t = setTimeout(() => setShow(true), 1500)
        return () => clearTimeout(t)
      }
    } catch { /* ignore */ }
  }, [])

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 95,
            width: '92%',
            maxWidth: 520,
            padding: '16px 20px',
            borderRadius: 'var(--r-xl)',
            background: 'rgba(20, 20, 28, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Иконка */}
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--r-md)',
            background: 'rgba(149,51,255,0.1)',
            border: '1px solid rgba(149,51,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Cookie size={20} style={{ color: 'var(--accent)' }} />
          </div>

          {/* Текст */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              {t('cookie.title')}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
              {t('cookie.text')}{' '}
              <Link to="/privacy" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                {t('cookie.link')}
              </Link>.
            </div>
          </div>

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={accept}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--r-full)',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 200ms',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {t('cookie.accept')}
            </button>
            <button
              onClick={accept}
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: 'var(--surface-2)',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
