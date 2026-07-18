import { motion } from 'framer-motion'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   SplashScreen — Анимированный экран загрузки
   ═══════════════════════════════════════════════════════════ */

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a0f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Gradient mesh фон */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 600px 400px at 30% 20%, rgba(149,51,255,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 500px 350px at 70% 80%, rgba(59,130,246,0.08) 0%, transparent 70%)
        `,
      }} />

      {/* Декоративные кольца */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.06 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          border: '1px solid rgba(149,51,255,0.3)',
        }}
      />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.04 }}
        transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          border: '1px solid rgba(149,51,255,0.2)',
        }}
      />

      {/* Логотип */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
      >
        {/* Иконка-щит */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 72, height: 72, borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, rgba(149,51,255,0.2), rgba(59,130,246,0.15))',
            border: '1px solid rgba(149,51,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#splash-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="splash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9533ff" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </motion.div>

        {/* Текстовый лого */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5, marginBottom: 8 }}
        >
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800,
            letterSpacing: '-0.04em', color: '#fff',
          }}>
            BAZZAR
          </span>
          <span style={{
            fontWeight: 500, fontSize: '1.4rem', color: '#9533ff',
            fontStyle: 'italic',
          }}>
            certs.
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          style={{
            fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500,
          }}
        >
          {t('splash.tagline')}
        </motion.p>
      </motion.div>

      {/* Прогресс-бар */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{
          position: 'absolute', bottom: 'clamp(60px, 12vw, 100px)',
          width: 200, zIndex: 1,
        }}
      >
        <div style={{
          height: 3, borderRadius: 'var(--r-full)',
          background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, delay: 1, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={onFinish}
            style={{
              height: '100%', borderRadius: 'var(--r-full)',
              background: 'linear-gradient(90deg, #9533ff, #3b82f6)',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
