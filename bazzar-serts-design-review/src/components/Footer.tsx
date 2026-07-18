import { Link } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Footer — Чистый, минималистичный (стиль Игромир)
   ═══════════════════════════════════════════════════════════ */

export function Footer() {
  const { t } = useI18n()

  const LINKS = {
    catalog: [
      { to: '/catalog?category=certs', label: t('cat.certs') },
      { to: '/catalog?category=apps', label: t('cat.apps') },
      { to: '/catalog?category=utils', label: t('cat.utils') },
      { to: '/order-check', label: t('footer.link.orderCheck') },
    ],
    help: [
      { to: '/how-it-works', label: t('footer.link.howItWorks') },
      { to: '/install-guide', label: t('footer.link.guide') },
      { to: '/guarantees', label: t('footer.link.guarantees') },
      { to: '/#faq', label: 'FAQ' },
    ],
    info: [
      { to: '/privacy', label: t('footer.link.privacy') },
      { to: '/#why', label: t('footer.link.about') },
      { to: '/#cta', label: t('footer.link.contacts') },
    ],
  }

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: 'var(--sp-10) 0 var(--sp-6)',
      background: 'var(--bg)',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--sp-8)',
          marginBottom: 'var(--sp-8)',
        }}>
          {/* Логотип */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', letterSpacing: '-0.04em', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>BAZZAR</span>
              <span style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--accent)', marginLeft: 4, fontStyle: 'italic' }}>certs.</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 260 }}>
              {t('footer.desc')}
            </p>
          </div>

          {/* Каталог */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('footer.catalog')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LINKS.catalog.map(link => (
                <Link key={link.to} to={link.to} style={{ fontSize: '0.85rem', color: 'var(--text-3)', transition: 'color 200ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Покупателям */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('footer.buyers')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LINKS.help.map(link => (
                <Link key={link.to} to={link.to} style={{ fontSize: '0.85rem', color: 'var(--text-3)', transition: 'color 200ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Информация */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('footer.info')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LINKS.info.map(link => (
                <Link key={link.to} to={link.to} style={{ fontSize: '0.85rem', color: 'var(--text-3)', transition: 'color 200ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Поддержка */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('footer.support')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://t.me/" target="_blank" rel="noopener" style={{ fontSize: '0.85rem', color: 'var(--text-3)', transition: 'color 200ms' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}>
                Telegram
              </a>
              <a href="mailto:support@bazzar-certs.shop" style={{ fontSize: '0.85rem', color: 'var(--text-3)', transition: 'color 200ms' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}>
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Копирайт */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            © {new Date().getFullYear()} Bazzar Certs. {t('footer.rights')}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
            {t('footer.notOffer')}
          </p>
        </div>
      </div>
    </footer>
  )
}
