import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ShieldCheck, ShieldAlert, Clock, Smartphone, Copy, Check, ArrowRight, RefreshCcw, AlertTriangle, Wifi } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../components/Toast'
import { useI18n, plural } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   CertDashboard — Панель статуса сертификата
   Как у Signulous: показывает статус, UDID, дату истечения
   ═══════════════════════════════════════════════════════════ */

// Моковые данные сертификатов
const MOCK_CERTS = [
  {
    id: 'CERT-VIP-2026-001',
    typeKey: 'dash.cert.vip',
    status: 'active' as const,
    udid: '00008110-000A4C8E3E90801E',
    deviceName: 'iPhone 15 Pro',
    iosVersion: 'iOS 18.3',
    issuedAt: '2026-06-15',
    expiresAt: '2027-06-15',
    daysLeft: 336,
    profiles: ['Development', 'Distribution'],
    appsInstalled: 12,
  },
  {
    id: 'CERT-STD-2026-042',
    typeKey: 'dash.cert.standard',
    status: 'expiring' as const,
    udid: '00008030-001D3A2E1128802E',
    deviceName: 'iPad Air 5',
    iosVersion: 'iPadOS 17.6',
    issuedAt: '2026-01-20',
    expiresAt: '2026-07-20',
    daysLeft: 6,
    profiles: ['Development'],
    appsInstalled: 5,
  },
]

export function CertDashboard() {
  const { t, lang } = useI18n()
  usePageTitle(t('dash.stat.active') + ' · Signing Dashboard')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  const STATUS_CONFIG = {
    active: {
      label: t('dash.status.active'),
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.2)',
      icon: ShieldCheck,
      glow: 'rgba(34,197,94,0.15)',
    },
    expiring: {
      label: t('dash.status.expiring'),
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
      icon: ShieldAlert,
      glow: 'rgba(245,158,11,0.15)',
    },
    revoked: {
      label: t('dash.status.revoked'),
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
      icon: AlertTriangle,
      glow: 'rgba(239,68,68,0.15)',
    },
  }

  const daysWord = (n: number) =>
    lang === 'ru' ? plural(n, ['день', 'дня', 'дней']) : n === 1 ? 'day' : 'days'

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    toast(t('dash.toast.copied', { label }), 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <section className="section" style={{ paddingTop: 'clamp(100px, 14vw, 140px)' }}>
      <div className="container" style={{ maxWidth: 860 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--r-lg)',
              background: 'rgba(149,51,255,0.1)',
              border: '1px solid rgba(149,51,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)' }}>Signing Dashboard</h1>
              <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: 4 }}>
                {t('dash.subtitle')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Status overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          {[
            { icon: ShieldCheck, label: t('dash.stat.active'), value: '1', color: '#22c55e' },
            { icon: Clock, label: t('dash.stat.expiring'), value: '1', color: '#f59e0b' },
            { icon: Smartphone, label: t('dash.stat.devices'), value: '2', color: 'var(--accent)' },
            { icon: Wifi, label: t('dash.stat.allOk'), value: '✓', color: '#22c55e' },
          ].map((stat, i) => (
            <div key={i} className="card" style={{
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <stat.icon size={20} style={{ color: stat.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Certificates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {MOCK_CERTS.map((cert, idx) => {
            const cfg = STATUS_CONFIG[cert.status]
            const StatusIcon = cfg.icon
            const progress = cert.daysLeft / 365

            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                className="card"
                style={{
                  padding: 'clamp(20px, 3vw, 28px)',
                  border: `1px solid ${cfg.border}`,
                  boxShadow: `0 0 30px ${cfg.glow}`,
                }}
              >
                {/* Cert Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, flexWrap: 'wrap', marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r-md)',
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <StatusIcon size={20} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t(cert.typeKey)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                        {cert.id}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '5px 14px', borderRadius: 'var(--r-full)',
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    color: cfg.color, fontSize: '0.75rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: cfg.color,
                      boxShadow: `0 0 8px ${cfg.color}`,
                      animation: cert.status === 'active' ? 'pulse 2s infinite' : 'none',
                    }} />
                    {cfg.label}
                  </span>
                </div>

                {/* Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16, marginBottom: 20,
                }}>
                  {/* Device */}
                  <div style={{
                    padding: 14, borderRadius: 'var(--r-md)',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      {t('dash.device')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Smartphone size={16} style={{ color: 'var(--accent)' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cert.deviceName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{cert.iosVersion}</div>
                      </div>
                    </div>
                  </div>

                  {/* UDID */}
                  <div style={{
                    padding: 14, borderRadius: 'var(--r-md)',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      UDID
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{
                        fontSize: '0.72rem', color: 'var(--text-2)',
                        fontFamily: 'monospace', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                      }}>
                        {cert.udid}
                      </code>
                      <button
                        onClick={() => copyToClipboard(cert.udid, 'UDID')}
                        style={{
                          padding: 4, borderRadius: 'var(--r-sm)',
                          background: 'transparent', border: 'none',
                          color: copiedId === cert.udid ? '#22c55e' : 'var(--text-3)',
                          cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        {copiedId === cert.udid ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{
                    padding: 14, borderRadius: 'var(--r-md)',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      {t('dash.validity')}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {cert.issuedAt} → {cert.expiresAt}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: cfg.color, marginTop: 4, fontWeight: 600 }}>
                      {cert.daysLeft} {daysWord(cert.daysLeft)} {t('dash.daysLeft')}
                    </div>
                  </div>

                  {/* Apps */}
                  <div style={{
                    padding: 14, borderRadius: 'var(--r-md)',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      {t('dash.profiles')}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {cert.profiles.join(', ')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                      {cert.appsInstalled} {t('dash.appsInstalled')}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{t('dash.validity')}</span>
                    <span style={{ fontSize: '0.72rem', color: cfg.color, fontWeight: 600 }}>
                      {Math.round(progress * 100)}%
                    </span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 'var(--r-full)',
                    background: 'var(--surface-2)',
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      style={{
                        height: '100%',
                        borderRadius: 'var(--r-full)',
                        background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`,
                        boxShadow: `0 0 12px ${cfg.color}40`,
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {cert.status === 'expiring' && (
                    <button className="btn btn-gradient" style={{ fontSize: '0.8rem', gap: 6 }}>
                      <RefreshCcw size={14} /> {t('dash.renew')}
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(cert.id, t('dash.certId'))}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem', gap: 6 }}
                  >
                    {copiedId === cert.id ? <Check size={14} /> : <Copy size={14} />}
                    {t('dash.copyId')}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{
            textAlign: 'center', marginTop: 40,
            padding: 'var(--sp-8)', borderRadius: 'var(--r-xl)',
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ marginBottom: 8 }}>{t('dash.ctaTitle')}</h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: 16 }}>
            {t('dash.ctaText')}
          </p>
          <Link to="/catalog?category=certs" className="btn btn-gradient" style={{ gap: 6 }}>
            {t('dash.cta')} <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
