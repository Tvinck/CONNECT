import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Package, ShieldCheck, Smartphone, Headphones, Copy, Check, Shield, ArrowRight, Send, BookOpen, ChevronDown, ChevronUp, Monitor, Plus, Trash2, Fingerprint, Crown, RefreshCw, Download, Zap, Heart, Star, ExternalLink, Calendar, Lock, Lightbulb, AlertTriangle, CheckCircle2, Tag, Mail, RotateCw, Box } from 'lucide-react'
import { useToast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n, plural } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Cabinet — 5 разделов как в оригинале
   ═══════════════════════════════════════════════════════════ */

interface Device {
  id: string
  udid: string
  name: string
  model: string
  addedAt: string
  isActive: boolean
  certsCount: number
}

export function Cabinet() {
  const { t, lang } = useI18n()
  usePageTitle(t('cabinet.title'))
  const { toast } = useToast()
  const [logged, setLogged] = useState(false)
  const [tab, setTab] = useState('profile')
  const [copied, setCopied] = useState(false)
  const [feedbackType, setFeedbackType] = useState('suggestion')
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', udid: '00008110-001A2D4E3C91801E', name: 'IPHONE_USER', model: 'iPhone 15 Pro', addedAt: '2024-06-12', isActive: true, certsCount: 2 },
    { id: '2', udid: '00008030-001C4F6A2148002E', name: 'iPad Mini', model: 'iPad mini 6', addedAt: '2024-09-05', isActive: true, certsCount: 1 },
  ])
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState('')
  const [newDeviceUdid, setNewDeviceUdid] = useState('')
  const [copiedUdid, setCopiedUdid] = useState<string | null>(null)

  const TABS = [
    { id: 'profile', label: t('cabinet.tab.profile'), icon: <User size={18} /> },
    { id: 'orders', label: t('cabinet.tab.orders'), icon: <Package size={18} /> },
    { id: 'certs', label: t('cabinet.tab.certs'), icon: <ShieldCheck size={18} /> },
    { id: 'apps', label: t('cabinet.tab.apps'), icon: <Smartphone size={18} /> },
    { id: 'devices', label: t('cabinet.tab.devices'), icon: <Monitor size={18} /> },
    { id: 'subs', label: t('cabinet.tab.subs'), icon: <Crown size={18} /> },
    { id: 'feedback', label: t('cabinet.tab.feedback'), icon: <Headphones size={18} /> },
  ]

  const deviceName = (d: Device) => d.name === 'IPHONE_USER'
    ? (lang === 'ru' ? 'iPhone Николая' : "Nikolay's iPhone")
    : d.name

  const deviceCountText = lang === 'ru'
    ? `${devices.length} ${plural(devices.length, ['устройство', 'устройства', 'устройств'])} ${t('cabinet.devices.linked')}`
    : `${devices.length} ${devices.length === 1 ? 'device' : 'devices'} ${t('cabinet.devices.linked')}`

  const handleCopyUdid = useCallback((udid: string) => {
    navigator.clipboard?.writeText(udid)
    setCopiedUdid(udid)
    toast(t('cabinet.toast.udidCopied'))
    setTimeout(() => setCopiedUdid(null), 2000)
  }, [t])

  const handleAddDevice = useCallback(() => {
    if (!newDeviceUdid.trim()) return
    const device: Device = {
      id: Date.now().toString(),
      udid: newDeviceUdid.trim(),
      name: newDeviceName.trim() || t('cabinet.devices.defaultName', { num: devices.length + 1 }),
      model: t('cabinet.devices.autoModel'),
      addedAt: new Date().toISOString().slice(0, 10),
      isActive: false,
      certsCount: 0,
    }
    setDevices(prev => [...prev, device])
    setNewDeviceName('')
    setNewDeviceUdid('')
    setShowAddDevice(false)
    toast(t('cabinet.toast.deviceAdded'))
  }, [newDeviceUdid, newDeviceName, devices.length, t])

  const handleRemoveDevice = useCallback((id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id))
    toast(t('cabinet.toast.deviceRemoved'))
  }, [t])

  /* ── Экран входа через UDID ──────────────────────────── */
  if (!logged) {
    return (
      <section className="section" style={{ paddingTop: 'clamp(100px, 14vw, 140px)' }}>
        <div className="container" style={{ maxWidth: 460, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 'var(--r-xl)', margin: '0 auto 20px',
              background: 'rgba(149,51,255,0.1)', border: '1px solid rgba(149,51,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={36} style={{ color: 'var(--accent)' }} />
            </div>

            <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', marginBottom: 8 }}>
              {t('cabinet.login.title')}
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', marginBottom: 'var(--sp-6)', lineHeight: 1.6 }}>
              {t('cabinet.login.subtitle')}
            </p>

            <div className="card" style={{
              padding: 'var(--sp-5)', textAlign: 'left',
              marginBottom: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', gap: 10, fontSize: '0.85rem', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0, fontSize: '0.78rem' }}>{t('cabinet.login.why')}</span>
                <p style={{ color: 'var(--text-2)' }}>
                  {t('cabinet.login.whyText')}
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)' }} />
              <div style={{ display: 'flex', gap: 10, fontSize: '0.85rem', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0, fontSize: '0.78rem' }}>{t('cabinet.login.safe')}</span>
                <p style={{ color: 'var(--text-2)' }}>
                  {t('cabinet.login.safeText')}
                </p>
              </div>
            </div>

            <button
              className="btn btn-gradient"
              onClick={() => setLogged(true)}
              style={{
                width: '100%', padding: '16px 0',
                fontSize: '1rem', fontWeight: 800,
                borderRadius: 'var(--r-md)', gap: 8,
              }}
            >
              <Smartphone size={18} />
              {t('cabinet.login.getUdid')}
            </button>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 12, lineHeight: 1.5 }}>
              {t('cabinet.login.hint')}
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

  /* ── Кабинет ─────────────────────────────────────────── */

  const handleCopy = () => {
    navigator.clipboard?.writeText('00000000-0000-0000-0000-000000000000')
    setCopied(true)
    toast(t('cabinet.toast.udidCopiedFull'))
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = () => {
    if (!feedbackMsg.trim()) return
    setFeedbackSent(true)
    setFeedbackMsg('')
    toast(t('cabinet.toast.msgSent'))
    setTimeout(() => setFeedbackSent(false), 3000)
  }

  return (
    <section className="section" style={{ paddingTop: 'clamp(80px, 10vw, 100px)' }}>
      <div className="container">
        <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', marginBottom: 'var(--sp-6)' }}>{t('cabinet.title')}</h1>

        <style>{`@media (min-width: 769px) { .cabinet-grid { grid-template-columns: 240px 1fr !important; } }`}</style>

        <div className="cabinet-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-5)', alignItems: 'start' }}>
          {/* Sidebar */}
          <nav className="card" style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TABS.map(tb => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', borderRadius: 'var(--r-md)',
                  background: tab === tb.id ? 'rgba(149,51,255,0.1)' : 'transparent',
                  color: tab === tb.id ? '#fff' : 'var(--text-3)',
                  fontWeight: 600, fontSize: '0.9rem', width: '100%',
                  transition: 'all 150ms', textAlign: 'left',
                  borderLeft: tab === tb.id ? '3px solid var(--accent)' : '3px solid transparent',
                }}
              >
                <span style={{ color: tab === tb.id ? 'var(--accent)' : 'var(--text-3)' }}>{tb.icon}</span>
                {tb.label}
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
            <button
              onClick={() => setLogged(false)}
              style={{
                padding: '13px 16px', borderRadius: 'var(--r-md)',
                color: '#ff4444', fontSize: '0.88rem', width: '100%',
                fontWeight: 600, transition: 'all 150ms', textAlign: 'left',
                borderLeft: '3px solid transparent',
              }}
            >
              {t('cabinet.logout')}
            </button>
          </nav>

          {/* Content */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={tab}>

            {/* ── Мой профиль ── */}
            {tab === 'profile' && (
              <div className="card" style={{ padding: 'var(--sp-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'var(--sp-6)' }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 'var(--r-lg)',
                    background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 800, color: '#fff',
                  }}>B</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{t('cabinet.user')}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>UDID: ****...0000</p>
                  </div>
                </div>

                {/* UDID копирование */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--sp-6)',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', padding: '14px 16px',
                }}>
                  <code style={{
                    flex: 1, fontSize: '0.75rem', color: 'var(--text)',
                    fontFamily: '"SF Mono", "Fira Code", monospace',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    00000000-0000-0000-0000-000000000000
                  </code>
                  <button
                    onClick={handleCopy}
                    className="btn btn-soft"
                    style={{
                      padding: '6px 12px', fontSize: '0.75rem',
                      borderRadius: 'var(--r-sm)', gap: 4,
                      color: copied ? 'var(--success)' : 'var(--text-2)',
                    }}
                  >
                    {copied ? <><Check size={13} /> {t('cabinet.copied')}</> : <><Copy size={13} /> {t('cabinet.copy')}</>}
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 0 }}>
                  {[
                    [t('cabinet.stat.purchases'), '0'],
                    [t('cabinet.stat.certs'), '0'],
                    [t('cabinet.stat.apps'), '0'],
                    [t('cabinet.stat.status'), t('cabinet.stat.statusNew')],
                    [t('cabinet.stat.regDate'), t('cabinet.stat.today')],
                  ].map(([label, value]) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '14px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem',
                    }}>
                      <span style={{ color: 'var(--text-2)' }}>{label}</span>
                      <span style={{ fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Мои покупки ── */}
            {tab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                {/* Покупка 1 — сертификат */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{
                    padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(34,197,94,0.06)', borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={14} style={{ color: 'var(--success)' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--success)' }}>{t('cabinet.order.delivered')}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{t('cabinet.order.num', { id: '48291' })}</span>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--r-md)', flexShrink: 0,
                        background: 'rgba(149,51,255,0.1)', border: '1px solid rgba(149,51,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t('cabinet.order.vip')}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{t('cabinet.order.vipSub')}</p>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>900 ₽</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> 10.07.2024</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Tag size={12} /> GGSel</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> Telegram: @user</span>
                    </div>
                  </div>
                </div>

                {/* Покупка 2 — приложение */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{
                    padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(34,197,94,0.06)', borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={14} style={{ color: 'var(--success)' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--success)' }}>{t('cabinet.order.delivered')}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{t('cabinet.order.num', { id: '48305' })}</span>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--r-md)', flexShrink: 0,
                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Smartphone size={20} style={{ color: '#22c55e' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>ESign Premium</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{t('cabinet.order.esignSub')}</p>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--success)' }}>{t('product.free')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> 10.07.2024</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Tag size={12} /> Digiseller</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Мои сертификаты ── */}
            {tab === 'certs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                <div className="card" style={{ padding: 'var(--sp-5)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 'var(--r-lg)', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(149,51,255,0.15), rgba(59,130,246,0.1))',
                      border: '1px solid rgba(149,51,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ShieldCheck size={24} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem' }}>{t('dash.cert.vip')}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Apple Developer Enterprise</p>
                    </div>
                    <div style={{
                      padding: '5px 12px', borderRadius: 'var(--r-full)',
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                      fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)',
                    }}>
                      {t('cabinet.cert.active')}
                    </div>
                  </div>

                  {/* Прогресс срока */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      <span>{t('cabinet.cert.daysLeft', { left: 341, total: 365 })}</span>
                      <span>93%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 'var(--r-full)', background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ width: '93%', height: '100%', borderRadius: 'var(--r-full)', background: 'var(--gradient)' }} />
                    </div>
                  </div>

                  {/* Детали */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      [t('cabinet.cert.plan'), t('cabinet.cert.planValue')],
                      [t('cabinet.cert.activated'), '10.07.2024'],
                      [t('cabinet.cert.expires'), '10.07.2025'],
                      [t('cabinet.cert.replacements'), t('cabinet.cert.replValue')],
                    ].map(([label, value]) => (
                      <div key={label} style={{
                        padding: '10px 14px', borderRadius: 'var(--r-sm)',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                      }}>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Кнопка Инструкция */}
                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="btn btn-soft"
                    style={{
                      width: '100%', marginTop: 16, padding: '13px 16px',
                      borderRadius: 'var(--r-md)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontSize: '0.88rem', fontWeight: 700,
                      background: showGuide ? 'rgba(149,51,255,0.12)' : undefined,
                      color: showGuide ? 'var(--accent)' : undefined,
                    }}
                  >
                    <BookOpen size={16} />
                    {t('cabinet.cert.guide')}
                    {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Инструкция — раскрывающийся блок */}
                  {showGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{
                        marginTop: 14, padding: '20px',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r-md)',
                      }}
                    >
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                        {t('cabinet.cert.guideTitle')}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3, 4, 5, 6, 7].map(n => (
                          <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                              background: 'rgba(149,51,255,0.12)', border: '1px solid rgba(149,51,255,0.25)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)',
                            }}>
                              {n}
                            </div>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.6, paddingTop: 1 }}>
                              {t(`cabinet.cert.step${n}`)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        marginTop: 16, padding: '12px 16px',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 'var(--r-sm)', fontSize: '0.8rem', color: '#f59e0b', lineHeight: 1.6,
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={14} /> {t('cabinet.cert.guideWarn')}</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Link to Dashboard */}
                <Link to="/dashboard" className="card card-hover" style={{
                  padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 12,
                  textDecoration: 'none',
                }}>
                  <Shield size={20} style={{ color: 'var(--accent)' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Signing Dashboard</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                      {t('cabinet.cert.dashDesc')}
                    </p>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-3)' }} />
                </Link>
              </div>
            )}

            {/* ── Мои приложения ── */}
            {tab === 'apps' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                <div className="card" style={{ padding: 'var(--sp-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 'var(--r-lg)', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.1))',
                      border: '1px solid rgba(34,197,94,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Smartphone size={24} style={{ color: '#22c55e' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem' }}>ESign</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{t('cabinet.apps.signer')}</p>
                    </div>
                    <div style={{
                      padding: '5px 12px', borderRadius: 'var(--r-full)',
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                      fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)',
                    }}>
                      {t('cabinet.apps.installed')}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 14, display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {t('cabinet.apps.installedOn', { date: '10.07.2024' })}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><RotateCw size={12} /> {t('cabinet.apps.updates', { count: 2 })}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Box size={12} /> com.esign.app</span>
                  </div>
                </div>

                <Link to="/catalog?category=apps" className="btn btn-soft" style={{ alignSelf: 'flex-start', gap: 6, fontSize: '0.85rem' }}>
                  {t('cabinet.apps.all')} <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* ── Мои устройства ── */}
            {tab === 'devices' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                {/* Шапка */}
                <div className="card" style={{ padding: 'var(--sp-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{t('cabinet.devices.title')}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
                        {deviceCountText}
                      </p>
                    </div>
                    <button
                      className="btn btn-gradient"
                      onClick={() => setShowAddDevice(!showAddDevice)}
                      style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', gap: 6, fontSize: '0.85rem' }}
                    >
                      <Plus size={16} />
                      {t('cabinet.devices.add')}
                    </button>
                  </div>

                  {/* Форма добавления */}
                  {showAddDevice && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{
                        marginTop: 'var(--sp-4)', paddingTop: 'var(--sp-4)',
                        borderTop: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', gap: 12,
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {t('cabinet.devices.name')}
                          </label>
                          <input
                            className="field"
                            placeholder={t('cabinet.devices.namePh')}
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            style={{ borderRadius: 'var(--r-md)', padding: '12px 14px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {t('cabinet.devices.udid')}
                          </label>
                          <input
                            className="field"
                            placeholder="00008110-001A2D4E3C91801E"
                            value={newDeviceUdid}
                            onChange={(e) => setNewDeviceUdid(e.target.value)}
                            style={{ borderRadius: 'var(--r-md)', padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.82rem' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-gradient"
                          onClick={handleAddDevice}
                          style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', gap: 6, fontSize: '0.85rem' }}
                        >
                          <Plus size={14} /> {t('cabinet.devices.addBtn')}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setShowAddDevice(false)}
                          style={{ padding: '10px 16px', borderRadius: 'var(--r-md)', fontSize: '0.85rem' }}
                        >
                          {t('cabinet.devices.cancel')}
                        </button>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                        <Lightbulb size={13} style={{ color: '#f59e0b', flexShrink: 0 }} /> {t('cabinet.devices.unknownUdid')} <Link to="/how-it-works" style={{ color: 'var(--accent)' }}>{t('cabinet.devices.learnHow')}</Link>
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Список устройств */}
                {devices.map((device, idx) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="card"
                    style={{ padding: 'var(--sp-5)', position: 'relative', overflow: 'hidden' }}
                  >
                    {/* Accent line */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: device.isActive ? 'var(--gradient)' : 'var(--border)',
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 'var(--r-lg)',
                          background: device.isActive ? 'rgba(52,199,89,0.1)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${device.isActive ? 'rgba(52,199,89,0.2)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Smartphone size={22} style={{ color: device.isActive ? 'var(--success)' : 'var(--text-3)' }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{deviceName(device)}</h4>
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
                              borderRadius: 'var(--r-full)', textTransform: 'uppercase', letterSpacing: '0.04em',
                              background: device.isActive ? 'rgba(52,199,89,0.12)' : 'rgba(255,149,0,0.1)',
                              color: device.isActive ? 'var(--success)' : '#ff9500',
                            }}>
                              {device.isActive ? t('cabinet.devices.active') : t('cabinet.devices.pending')}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 8 }}>{device.model}</p>

                          {/* UDID */}
                          <div
                            onClick={() => handleCopyUdid(device.udid)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 8,
                              padding: '6px 12px', borderRadius: 'var(--r-md)',
                              background: 'rgba(149,51,255,0.06)', border: '1px solid rgba(149,51,255,0.12)',
                              cursor: 'pointer', transition: 'all 200ms',
                            }}
                          >
                            <Fingerprint size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            <code style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                              {device.udid}
                            </code>
                            {copiedUdid === device.udid
                              ? <Check size={14} style={{ color: 'var(--success)' }} />
                              : <Copy size={14} style={{ color: 'var(--text-3)' }} />
                            }
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveDevice(device.id)}
                        style={{
                          padding: '8px', borderRadius: 'var(--r-md)',
                          color: 'var(--text-3)', transition: 'all 200ms',
                          background: 'transparent',
                        }}
                        title={t('cabinet.devices.removeTitle')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Метаинфо */}
                    <div style={{
                      display: 'flex', gap: 'var(--sp-5)', marginTop: 'var(--sp-4)',
                      paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--border)',
                      fontSize: '0.78rem', color: 'var(--text-3)', flexWrap: 'wrap',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Calendar size={13} style={{ opacity: 0.6 }} /> {t('cabinet.devices.addedOn', { date: device.addedAt })}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Lock size={13} style={{ opacity: 0.6 }} /> {t('cabinet.devices.certsCount', { count: device.certsCount })}</span>
                    </div>
                  </motion.div>
                ))}

                {devices.length === 0 && (
                  <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
                    <Monitor size={40} style={{ color: 'var(--text-3)', margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>{t('cabinet.devices.empty')}</p>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginTop: 4 }}>{t('cabinet.devices.emptyDesc')}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Мои подписки ── */}
            {tab === 'subs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                {/* Шапка */}
                <div className="card" style={{ padding: 'var(--sp-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{t('cabinet.subs.title')}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>{t('cabinet.subs.active', { count: 1 })}</p>
                    </div>
                    <Link to="/catalog?category=subs" className="btn btn-soft" style={{ padding: '10px 18px', borderRadius: 'var(--r-md)', gap: 6, fontSize: '0.85rem' }}>
                      {t('cabinet.subs.catalog')} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Карточка Клуб Романтики */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                  style={{ padding: 0, overflow: 'hidden' }}
                >
                  {/* Хедер карточки с градиентом */}
                  <div style={{
                    background: 'linear-gradient(135deg, #e91e63, #9c27b0, #673ab7)',
                    padding: 'var(--sp-5)', color: '#fff',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.08 }}><Heart size={140} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 'var(--r-lg)',
                          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Heart size={26} fill="#fff" color="#fff" />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('cabinet.subs.rc')}</h4>
                          <p style={{ fontSize: '0.82rem', opacity: 0.85 }}>{t('cabinet.subs.rcSub')}</p>
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 'var(--r-full)',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
                        fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} /> {t('cabinet.subs.activeTag')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Тело карточки */}
                  <div style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

                    {/* Статус подписки */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Zap size={16} style={{ color: 'var(--accent)' }} />
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t('cabinet.subs.status')}</h5>
                      </div>
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10,
                      }}>
                        {[
                          { label: t('cabinet.subs.plan'), value: 'Premium', color: 'var(--accent)' },
                          { label: t('cabinet.subs.activeUntil'), value: '17.08.2026', color: 'var(--success)' },
                          { label: t('cabinet.subs.autoRenew'), value: t('cabinet.subs.autoRenewOn'), color: 'var(--success)' },
                          { label: t('cabinet.subs.modVersion'), value: 'v2.8.1', color: 'var(--text-2)' },
                        ].map((stat, i) => (
                          <div key={i} style={{
                            padding: '12px 14px', borderRadius: 'var(--r-md)',
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                          }}>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{stat.label}</p>
                            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)' }} />

                    {/* Что даёт мод */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Star size={16} style={{ color: '#fbbf24' }} />
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t('cabinet.subs.perks')}</h5>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          { text: t('cabinet.subs.perk1'), color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                            icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6 3h12l4 6-10 12L2 9l4-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M2 9h20M12 21L8 9l4-6 4 6-4 12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
                          { text: t('cabinet.subs.perk2'), color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)',
                            icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                          { text: t('cabinet.subs.perk3'), color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                          { text: t('cabinet.subs.perk4'), color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
                            icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M12 2C6.48 2 2 6 2 6s4 2 10 2 10-2 10-2-4.48-4-10-4zM4 9v9c0 2.21 3.58 4 8 4s8-1.79 8-4V9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v6M9 13l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                          { text: t('cabinet.subs.perk5'), color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" opacity="0.3"/><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/></svg> },
                          { text: t('cabinet.subs.perk6'), color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
                        ].map((feat, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 'var(--r-md)',
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                            fontSize: '0.82rem', color: 'var(--text-2)',
                            transition: 'all 200ms',
                          }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%',
                              background: feat.gradient, color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: `0 2px 8px ${feat.color}33`,
                            }}>
                              {feat.icon}
                            </div>
                            {feat.text}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)' }} />

                    {/* Прогресс */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <BookOpen size={16} style={{ color: '#06b6d4' }} />
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t('cabinet.subs.progress')}</h5>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { name: t('cabinet.subs.story1'), progress: 85, season: '3/3', color: '#e91e63' },
                          { name: t('cabinet.subs.story2'), progress: 62, season: '2/3', color: '#4caf50' },
                          { name: t('cabinet.subs.story3'), progress: 100, season: '2/2', color: '#ff9800' },
                          { name: t('cabinet.subs.story4'), progress: 30, season: '1/4', color: '#9c27b0' },
                        ].map((story, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 'var(--r-md)',
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{story.name}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{t('cabinet.subs.season', { n: story.season })}</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${story.progress}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  style={{ height: '100%', borderRadius: 3, background: story.color }}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{story.progress}%</span>
                                {story.progress === 100 && <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><CheckCircle2 size={11} /> {t('cabinet.subs.completed')}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)' }} />

                    {/* Привязка устройства */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Smartphone size={16} style={{ color: 'var(--success)' }} />
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t('cabinet.subs.device')}</h5>
                      </div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 16px', borderRadius: 'var(--r-md)',
                        background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)',
                        flexWrap: 'wrap', gap: 10,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Smartphone size={18} style={{ color: 'var(--success)' }} />
                          <div>
                            <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{lang === 'ru' ? 'iPhone Николая' : "Nikolay's iPhone"}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>00008110-001A2D4E...801E</p>
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost"
                          onClick={() => { setTab('devices'); toast(t('cabinet.toast.pickDevice')) }}
                          style={{ fontSize: '0.78rem', gap: 4, padding: '6px 12px' }}
                        >
                          <RefreshCw size={12} /> {t('cabinet.subs.change')}
                        </button>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)' }} />

                    {/* Гайд по установке */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Download size={16} style={{ color: '#f59e0b' }} />
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t('cabinet.subs.install')}</h5>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 'var(--r-md)',
                            background: 'var(--surface-2)',
                          }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: 'rgba(149,51,255,0.12)', color: 'var(--accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
                            }}>{n}</div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{t(`cabinet.subs.installStep${n}`)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)' }} />

                    {/* Перенос прогресса */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <RefreshCw size={16} style={{ color: '#8b5cf6' }} />
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t('cabinet.subs.transfer')}</h5>
                      </div>
                      <div style={{
                        padding: '16px', borderRadius: 'var(--r-md)',
                        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)',
                      }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 12 }}>
                          {t('cabinet.subs.transferText')}
                        </p>
                        <ol style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                          <li>{t('cabinet.subs.transfer1')}</li>
                          <li>{t('cabinet.subs.transfer2')}</li>
                          <li>{t('cabinet.subs.transfer3')}</li>
                          <li>{t('cabinet.subs.transfer4')}</li>
                        </ol>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 8 }}>
                        <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0 }} /> {t('cabinet.subs.transferHelp')} <button onClick={() => setTab('feedback')} style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', padding: 0, fontSize: 'inherit' }}>{t('cabinet.subs.transferHelpLink')}</button>
                      </p>
                    </div>

                    {/* Кнопки действий */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                      <button className="btn btn-gradient" style={{ padding: '12px 24px', borderRadius: 'var(--r-md)', gap: 6, fontSize: '0.85rem' }}>
                        <Download size={16} /> {t('cabinet.subs.download')}
                      </button>
                      <Link to="/install-guide" className="btn btn-soft" style={{ padding: '12px 20px', borderRadius: 'var(--r-md)', gap: 6, fontSize: '0.85rem' }}>
                        <BookOpen size={16} /> {t('cabinet.subs.guide')}
                      </Link>
                      <button className="btn btn-ghost" style={{ padding: '12px 20px', borderRadius: 'var(--r-md)', gap: 6, fontSize: '0.85rem' }}>
                        <ExternalLink size={16} /> {t('cabinet.subs.openGgsel')}
                      </button>
                    </div>

                  </div>
                </motion.div>

              </div>
            )}

            {/* ── Обратная связь ── */}
            {tab === 'feedback' && (
              <div className="card" style={{ padding: 'var(--sp-6)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--sp-5)' }}>{t('cabinet.feedback.title')}</h3>

                {/* Тип обращения */}
                <div style={{ marginBottom: 'var(--sp-4)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('cabinet.feedback.type')}
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { id: 'suggestion', label: t('cabinet.feedback.suggestion') },
                      { id: 'problem', label: t('cabinet.feedback.problem') },
                      { id: 'question', label: t('cabinet.feedback.question') },
                    ].map(ft => (
                      <button
                        key={ft.id}
                        onClick={() => setFeedbackType(ft.id)}
                        style={{
                          padding: '8px 16px', borderRadius: 'var(--r-full)',
                          fontSize: '0.82rem', fontWeight: 600,
                          background: feedbackType === ft.id ? 'rgba(149,51,255,0.15)' : 'var(--surface-2)',
                          color: feedbackType === ft.id ? 'var(--accent)' : 'var(--text-3)',
                          border: `1px solid ${feedbackType === ft.id ? 'rgba(149,51,255,0.3)' : 'var(--border)'}`,
                          transition: 'all 200ms',
                        }}
                      >
                        {ft.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Сообщение */}
                <div style={{ marginBottom: 'var(--sp-4)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('cabinet.feedback.message')}
                  </label>
                  <textarea
                    className="field"
                    placeholder={t('cabinet.feedback.placeholder')}
                    value={feedbackMsg}
                    onChange={(e) => setFeedbackMsg(e.target.value)}
                    style={{
                      borderRadius: 'var(--r-md)', minHeight: 120, resize: 'vertical',
                      padding: '14px 16px', lineHeight: 1.6,
                    }}
                  />
                </div>

                {/* Кнопка */}
                <button
                  className="btn btn-gradient"
                  onClick={handleFeedback}
                  style={{ padding: '14px 28px', borderRadius: 'var(--r-md)', gap: 8 }}
                >
                  <Send size={16} />
                  {t('cabinet.feedback.send')}
                </button>

                {feedbackSent && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: 12, fontWeight: 600 }}
                  >
                    {t('cabinet.feedback.sent')}
                  </motion.p>
                )}
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </section>
  )
}
