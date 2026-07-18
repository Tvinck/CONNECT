import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, CheckCircle, Clock, AlertTriangle, XCircle, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react'
import { useToast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   OrderCheck — Проверка заказа (ggsel / digiseller)
   ═══════════════════════════════════════════════════════════ */

type OrderStatus = 'pending' | 'paid' | 'delivered' | 'error'

interface OrderResult {
  id: string
  status: OrderStatus
  productKey: string
  date: string
  email: string
  platform: 'ggsel' | 'digiseller'
  code?: string
}

/* Демо-данные для дизайна */
const DEMO_ORDERS: Record<string, OrderResult> = {
  '12345': {
    id: '12345', status: 'delivered', productKey: 'order.demo.vip',
    date: '14.07.2024, 15:32', email: 'us***@gmail.com', platform: 'ggsel',
    code: 'CERT-VIP-XXXX-XXXX-XXXX',
  },
  '67890': {
    id: '67890', status: 'paid', productKey: 'order.demo.standard',
    date: '14.07.2024, 14:10', email: 'te***@mail.ru', platform: 'digiseller',
  },
  '11111': {
    id: '11111', status: 'pending', productKey: 'order.demo.basic',
    date: '14.07.2024, 16:00', email: 'de***@ya.ru', platform: 'ggsel',
  },
}

export function OrderCheck() {
  const { t } = useI18n()
  usePageTitle(t('order.title'))
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OrderResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const STATUS_CONFIG = {
    pending: { label: t('order.status.pending'), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={18} /> },
    paid: { label: t('order.status.paid'), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Package size={18} /> },
    delivered: { label: t('order.status.delivered'), color: 'var(--success)', bg: 'rgba(34,197,94,0.1)', icon: <CheckCircle size={18} /> },
    error: { label: t('order.status.error'), color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={18} /> },
  }

  const handleSearch = () => {
    const id = orderId.trim()
    if (!id) return

    setLoading(true)
    setResult(null)
    setNotFound(false)

    // Имитация запроса
    setTimeout(() => {
      const found = DEMO_ORDERS[id]
      if (found) {
        setResult(found)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }, 1200)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    toast(t('order.toast.copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const cfg = result ? STATUS_CONFIG[result.status] : null

  return (
    <section className="section" style={{ paddingTop: 'clamp(100px, 14vw, 140px)' }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Заголовок */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--r-xl)',
              background: 'rgba(149,51,255,0.1)', border: '1px solid rgba(149,51,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Package size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', marginBottom: 8 }}>
              {t('order.title')}
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {t('order.subtitle')}
            </p>
          </div>

          {/* Поле ввода */}
          <div className="card" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-4)' }}>
            <label style={{
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)',
              marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {t('order.label')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                <input
                  className="field"
                  type="text"
                  placeholder={t('order.placeholder')}
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ paddingLeft: 40, height: 48, borderRadius: 'var(--r-md)', fontSize: '0.92rem' }}
                />
              </div>
              <button
                className="btn btn-gradient"
                onClick={handleSearch}
                disabled={loading}
                style={{ padding: '0 24px', borderRadius: 'var(--r-md)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                  />
                ) : t('order.check')}
              </button>
            </div>

            {/* Платформы */}
            <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{t('order.platforms')}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="https://ggsel.com" target="_blank" rel="noopener" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 'var(--r-full)',
                  background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.15)',
                  fontSize: '0.72rem', fontWeight: 600, color: '#ff6b00', transition: 'all 200ms',
                }}>
                  GGsel <ExternalLink size={10} />
                </a>
                <a href="https://digiseller.market" target="_blank" rel="noopener" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 'var(--r-full)',
                  background: 'rgba(0,150,255,0.08)', border: '1px solid rgba(0,150,255,0.15)',
                  fontSize: '0.72rem', fontWeight: 600, color: '#0096ff', transition: 'all 200ms',
                }}>
                  Digiseller <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Результат */}
          <AnimatePresence mode="wait">
            {/* Загрузка */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card"
                style={{ padding: 'var(--sp-8)', textAlign: 'center' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 40, height: 40, margin: '0 auto 16px',
                    border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                  }}
                />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>{t('order.checking')}</p>
              </motion.div>
            )}

            {/* Не найден */}
            {!loading && notFound && (
              <motion.div
                key="notfound"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card"
                style={{ padding: 'var(--sp-8)', textAlign: 'center' }}
              >
                <AlertTriangle size={40} style={{ color: '#f59e0b', marginBottom: 16 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{t('order.notFound')}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', maxWidth: 340, margin: '0 auto', lineHeight: 1.5 }}>
                  {t('order.notFoundDesc')}
                </p>
              </motion.div>
            )}

            {/* Найден */}
            {!loading && result && cfg && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card"
                style={{ padding: 0, overflow: 'hidden' }}
              >
                {/* Статус-бар */}
                <div style={{
                  padding: '16px 20px',
                  background: cfg.bg,
                  borderBottom: `1px solid ${cfg.color}20`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: cfg.color }}>{cfg.label}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 600,
                    padding: '3px 10px', borderRadius: 'var(--r-full)',
                    background: result.platform === 'ggsel' ? 'rgba(255,107,0,0.1)' : 'rgba(0,150,255,0.1)',
                    color: result.platform === 'ggsel' ? '#ff6b00' : '#0096ff',
                    textTransform: 'uppercase',
                  }}>
                    {result.platform}
                  </span>
                </div>

                {/* Детали */}
                <div style={{ padding: '0' }}>
                  {[
                    [t('order.field.id'), `#${result.id}`],
                    [t('order.field.product'), t(result.productKey)],
                    [t('order.field.date'), result.date],
                    [t('order.field.email'), result.email],
                  ].map(([label, value]) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 20px', borderBottom: '1px solid var(--border)',
                      fontSize: '0.88rem',
                    }}>
                      <span style={{ color: 'var(--text-3)' }}>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Код (если доставлен) */}
                {result.code && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t('order.code')}
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)', padding: '12px 14px',
                    }}>
                      <code style={{
                        flex: 1, fontSize: '0.82rem', fontWeight: 600, color: 'var(--success)',
                        fontFamily: '"SF Mono", "Fira Code", monospace',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {result.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(result.code!)}
                        className="btn btn-soft"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 'var(--r-sm)', gap: 4 }}
                      >
                        {copied ? <><Check size={13} /> {t('order.done')}</> : <><Copy size={13} /> {t('cabinet.copy')}</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Степы прогресса */}
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
                    {[
                      { key: 'pending', label: t('order.step.created') },
                      { key: 'paid', label: t('order.step.paid') },
                      { key: 'delivered', label: t('order.step.delivered') },
                    ].map((step, i) => {
                      const statuses: OrderStatus[] = ['pending', 'paid', 'delivered']
                      const currentIdx = statuses.indexOf(result.status)
                      const stepIdx = statuses.indexOf(step.key as OrderStatus)
                      const isCompleted = stepIdx <= currentIdx
                      const isCurrent = stepIdx === currentIdx

                      return (
                        <div key={step.key} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                          {/* Линия */}
                          {i < 2 && (
                            <div style={{
                              position: 'absolute', top: 12, left: '50%', width: '100%', height: 2,
                              background: isCompleted && stepIdx < currentIdx ? 'var(--success)' : 'var(--border)',
                              zIndex: 0,
                            }} />
                          )}
                          {/* Круг */}
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', margin: '0 auto 8px',
                            background: isCompleted ? (isCurrent ? cfg.color : 'var(--success)') : 'var(--surface-2)',
                            border: `2px solid ${isCompleted ? 'transparent' : 'var(--border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', zIndex: 2,
                          }}>
                            {isCompleted && <Check size={12} style={{ color: '#fff' }} />}
                          </div>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600,
                            color: isCompleted ? 'var(--text)' : 'var(--text-3)',
                          }}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Демо-подсказка */}
          <div style={{ textAlign: 'center', marginTop: 'var(--sp-6)' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 8 }}>
              {t('order.demo')} <code style={{ color: 'var(--accent)' }}>12345</code>, <code style={{ color: 'var(--accent)' }}>67890</code>, <code style={{ color: 'var(--accent)' }}>11111</code>
            </p>
            <Link to="/catalog" className="btn btn-ghost" style={{ fontSize: '0.82rem', gap: 4 }}>
              {t('order.toCatalog')} <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
