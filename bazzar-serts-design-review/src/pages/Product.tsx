import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Shield, Zap, Clock, Heart, Check, ArrowRight, Truck, RefreshCcw, Headphones, Flame, Sparkles, Tag, Gift, TrendingUp } from 'lucide-react'
import { products, reviews } from '../data/catalog'
import { DynamicIcon } from '../components/DynamicIcon'
import { ProductCard } from '../components/ProductCard'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Product — Полная страница товара
   ═══════════════════════════════════════════════════════════ */

const TAB_IDS = ['desc', 'specs', 'delivery', 'reviews'] as const

export function Product() {
  const { id } = useParams<{ id: string }>()
  const { t, l, locale } = useI18n()
  const product = products.find(p => p.id === id)
  usePageTitle(product ? l(product.title) : t('product.notFound'))
  const [selectedDenom, setSelectedDenom] = useState('standard')
  const [telegram, setTelegram] = useState('')
  const [promo, setPromo] = useState('')
  const [liked, setLiked] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof TAB_IDS)[number]>('desc')
  const { viewed, addViewed } = useRecentlyViewed()

  const DENOMINATIONS = [
    { id: 'basic', label: t('product.plan.basic'), days: t('product.days.40'), price: 390, desc: t('product.plan.basicDesc') },
    { id: 'standard', label: t('product.plan.standard'), days: t('product.days.180'), price: 890, desc: t('product.plan.standardDesc') },
    { id: 'vip', label: t('product.plan.vip'), days: t('product.days.365'), price: 1490, desc: t('product.plan.vipDesc') },
  ]

  const TABS: { id: (typeof TAB_IDS)[number]; label: string }[] = [
    { id: 'desc', label: t('product.tab.desc') },
    { id: 'specs', label: t('product.tab.specs') },
    { id: 'delivery', label: t('product.tab.delivery') },
    { id: 'reviews', label: t('product.tab.reviews') },
  ]

  // Трекать просмотр
  useEffect(() => {
    if (product) addViewed(product.id)
  }, [product?.id])

  if (!product) {
    return (
      <section className="section" style={{ paddingTop: 'clamp(100px, 14vw, 140px)' }}>
        <div className="container" style={{ textAlign: 'center', padding: 'var(--sp-16) 0' }}>
          <Shield size={48} style={{ color: 'var(--text-3)', marginBottom: 16 }} />
          <h2 style={{ marginTop: 16 }}>{t('product.notFound')}</h2>
          <p style={{ color: 'var(--text-3)', margin: '8px 0 24px', fontSize: '0.9rem' }}>{t('product.notFoundDesc')}</p>
          <Link to="/catalog" className="btn btn-gradient" style={{ gap: 6 }}>{t('nav.catalog')} <ArrowRight size={16} /></Link>
        </div>
      </section>
    )
  }

  const isCert = product.category === 'certs'
  const currentPrice = isCert
    ? DENOMINATIONS.find(d => d.id === selectedDenom)?.price || product.price
    : product.price

  // Похожие товары
  const similar = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)

  return (
    <section className="section" style={{ paddingTop: 'clamp(80px, 10vw, 100px)' }}>
      <div className="container">
        {/* Хлебные крошки */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--sp-6)', fontSize: '0.82rem', flexWrap: 'wrap' }}
        >
          <Link to="/" style={{ color: 'var(--text-3)', transition: 'color 200ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}>
            {t('nav.home')}
          </Link>
          <span style={{ color: 'var(--text-3)' }}>›</span>
          <Link to="/catalog" style={{ color: 'var(--text-3)', transition: 'color 200ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}>
            {t('nav.catalog')}
          </Link>
          <span style={{ color: 'var(--text-3)' }}>›</span>
          <span style={{ color: 'var(--text-2)' }}>{l(product.title)}</span>
        </motion.div>

        <style>{`
          @media (min-width: 769px) {
            .product-grid { grid-template-columns: 1fr 400px !important; }
          }
        `}</style>

        <div className="product-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--sp-6)',
          alignItems: 'start',
        }}>
          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Баннер с иконкой */}
            <div className="card" style={{
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `radial-gradient(circle at 50% 60%, ${product.color}18 0%, var(--surface-2) 70%)`,
              marginBottom: 'var(--sp-6)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Декоративные кольца */}
              <div style={{
                position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                border: `1px solid ${product.color}15`, top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
              }} />
              <div style={{
                position: 'absolute', width: 300, height: 300, borderRadius: '50%',
                border: `1px solid ${product.color}08`, top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
              }} />

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: 100, height: 100, borderRadius: 'var(--r-xl)',
                  background: `${product.color}18`,
                  border: `1px solid ${product.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1,
                }}
              >
                <DynamicIcon name={product.icon} size={48} style={{ color: product.color }} />
              </motion.div>

              <button
                onClick={() => setLiked(!liked)}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(20,20,20,0.7)', backdropFilter: 'blur(10px)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: liked ? '#ff2121' : 'var(--text-3)',
                  transition: 'all 200ms', zIndex: 2,
                }}
              >
                <Heart size={18} fill={liked ? '#ff2121' : 'none'} />
              </button>
              {product.badge && (
                <span className={`badge badge-${product.badge}`} style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
                  {product.badge === 'hot' && <><Flame size={12} /> {t('badge.hot')}</>}
                  {product.badge === 'new' && <><Sparkles size={12} /> {t('badge.new')}</>}
                  {product.badge === 'sale' && <><Tag size={12} /> {t('badge.sale')}</>}
                  {product.badge === 'popular' && <><TrendingUp size={12} /> {t('badge.popular')}</>}
                  {product.badge === 'free' && <><Gift size={12} /> {t('badge.free')}</>}
                </span>
              )}
            </div>

            {/* Заголовок + рейтинг */}
            <div style={{ marginBottom: 'var(--sp-6)' }}>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', marginBottom: 8, lineHeight: 1.2 }}>
                {l(product.title)}
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', marginBottom: 'var(--sp-4)' }}>
                {l(product.subtitle)}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={16} fill={s <= Math.round(product.rating) ? '#fcab14' : 'transparent'} stroke={s <= Math.round(product.rating) ? '#fcab14' : 'var(--text-3)'} />
                  ))}
                  <span style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 700, marginLeft: 4 }}>{product.rating}</span>
                </div>
                <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>{product.sold.toLocaleString(locale)} {t('product.sales')}</span>
                <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>{t('product.inStock')}</span>
              </div>
            </div>

            {/* Табы */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 'var(--sp-4)', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600,
                    color: activeTab === tab.id ? '#fff' : 'var(--text-3)',
                    borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 200ms', marginBottom: -1,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Содержимое табов */}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {activeTab === 'desc' && (
                <div className="card" style={{ padding: 'var(--sp-6)' }}>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.8 }}>
                    {l(product.description)}
                  </p>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {[
                    [t('product.spec.category'), t(`product.catName.${product.category}`)],
                    [t('product.spec.delivery'), l(product.delivery)],
                    [t('product.spec.rating'), `${product.rating} / 5.0`],
                    [t('product.spec.sold'), product.sold.toLocaleString(locale)],
                    [t('product.spec.compat'), 'iOS 15+, iPhone / iPad'],
                    [t('product.spec.warranty'), t('product.warrantyValue')],
                  ].map(([label, value], i) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 20px', fontSize: '0.88rem',
                      borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span style={{ color: 'var(--text-3)' }}>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {[
                    { icon: <Truck size={20} />, title: t('trust.delivery'), desc: t('product.delivery.email'), color: 'var(--accent)' },
                    { icon: <RefreshCcw size={20} />, title: t('trust.guarantee'), desc: t('product.delivery.replace'), color: 'var(--success)' },
                    { icon: <Headphones size={20} />, title: t('trust.support'), desc: t('product.delivery.support'), color: '#25a2e0' },
                  ].map(item => (
                    <div key={item.title} className="card" style={{ padding: 'var(--sp-5)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--r-md)', flexShrink: 0,
                        background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: item.color,
                      }}>
                        {item.icon}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 4 }}>{item.title}</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {reviews.slice(0, 3).map(r => (
                    <div key={r.id} className="card" style={{ padding: 'var(--sp-5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 800, color: '#fff',
                        }}>{l(r.avatar)}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{l(r.name)}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{l(r.date)}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} fill={s <= r.rating ? '#fcab14' : 'transparent'} stroke={s <= r.rating ? '#fcab14' : 'var(--text-3)'} />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{l(r.text)}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* ══ ПРАВАЯ КОЛОНКА — ПОКУПКА (sticky) ══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ position: 'sticky', top: 80 }}
          >
            <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {/* Цена крупно */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900 }}>
                  {currentPrice === 0 ? t('product.free') : `${currentPrice} ₽`}
                </span>
                {product.oldPrice && (
                  <span style={{ fontSize: '1rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>
                    {product.oldPrice} ₽
                  </span>
                )}
              </div>

              {/* Тарифы для сертификатов */}
              {isCert && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('product.choosePlan')}
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {DENOMINATIONS.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDenom(d.id)}
                        style={{
                          padding: '14px 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderRadius: 'var(--r-md)',
                          border: `1px solid ${selectedDenom === d.id ? 'var(--accent)' : 'var(--border)'}`,
                          background: selectedDenom === d.id ? 'rgba(149,51,255,0.08)' : 'var(--surface-2)',
                          transition: 'all 200ms',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            border: `2px solid ${selectedDenom === d.id ? 'var(--accent)' : 'var(--text-3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 200ms',
                          }}>
                            {selectedDenom === d.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{d.label}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{d.days} · {d.desc}</p>
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>{d.price} ₽</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Telegram */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Telegram <span style={{ fontWeight: 400, opacity: 0.6 }}>({t('product.telegramOptional')})</span>
                </label>
                <input className="field" type="text" placeholder="@username" value={telegram}
                  onChange={(e) => setTelegram(e.target.value)} style={{ borderRadius: 'var(--r-md)' }} />
              </div>

              {/* Промокод */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('product.promo')}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="field" type="text" placeholder="BAZZAR2024" value={promo}
                    onChange={(e) => setPromo(e.target.value)} style={{ flex: 1, borderRadius: 'var(--r-md)' }} />
                  <button className="btn btn-soft" style={{ padding: '12px 16px', borderRadius: 'var(--r-md)' }}>OK</button>
                </div>
              </div>

              {/* CTA кнопка */}
              <button className="btn btn-gradient" style={{
                width: '100%', padding: '16px 0', fontSize: '1.05rem', fontWeight: 800,
                borderRadius: 'var(--r-md)', marginTop: 4,
              }}>
                {currentPrice === 0 ? t('product.installFree') : t('product.buyFor', { price: currentPrice })}
              </button>

              {/* Гарантии */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                {[
                  { icon: <Shield size={15} />, text: t('product.guarantee.replace') },
                  { icon: <Zap size={15} />, text: t('trust.delivery') },
                  { icon: <Clock size={15} />, text: t('product.support.tg') },
                  { icon: <Check size={15} />, text: t('trust.payment') },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--success)' }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ══ ПОХОЖИЕ ТОВАРЫ ══ */}
        {similar.length > 0 && (
          <div style={{ marginTop: 'var(--sp-10)' }}>
            <div className="section-head">
              <h2>{t('product.similar')}</h2>
              <Link to={`/catalog?category=${product.category}`} className="btn btn-ghost" style={{ fontSize: '0.82rem', gap: 4 }}>
                {t('general.all')} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid-products">
              {similar.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
        {/* Недавно просмотренные */}
        {(() => {
          const recentProducts = viewed
            .filter(vid => vid !== product.id)
            .map(vid => products.find(p => p.id === vid))
            .filter(Boolean)
            .slice(0, 4)
          if (recentProducts.length === 0) return null
          return (
            <div style={{ marginTop: 'var(--sp-10)' }}>
              <div className="section-head">
                <h2>{t('product.recent')}</h2>
              </div>
              <div className="grid-products">
                {recentProducts.map((p, i) => <ProductCard key={p!.id} product={p!} index={i} />)}
              </div>
            </div>
          )
        })()}
      </div>
    </section>
  )
}
