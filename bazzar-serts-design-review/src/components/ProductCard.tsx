import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Flame, Sparkles, Tag, Gift, TrendingUp } from 'lucide-react'
import { DynamicIcon } from './DynamicIcon'
import { useI18n } from '../hooks/useI18n'
import type { Product } from '../data/catalog'

/* ═══════════════════════════════════════════════════════════
   ProductCard — С SVG-иконками и цветовым акцентом
   ═══════════════════════════════════════════════════════════ */

interface Props {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: Props) {
  const { t, l, locale } = useI18n()
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/product/${product.id}`}>
        <div className="card card-hover" style={{
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          {/* Иконка — цветная с подсветкой */}
          <div style={{
            aspectRatio: '4/3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `radial-gradient(circle at 50% 60%, ${product.color}12 0%, var(--surface-2) 70%)`,
            position: 'relative',
          }}>
            <div className="card-icon" style={{
              width: 72, height: 72, borderRadius: 'var(--r-lg)',
              background: `${product.color}18`,
              border: `1px solid ${product.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)',
            }}>
              <DynamicIcon name={product.icon} size={32} style={{ color: product.color }} />
            </div>

            {/* Бейдж */}
            {product.badge && (
              <span className={`badge badge-${product.badge}`} style={{ position: 'absolute', top: 10, left: 10 }}>
                {product.badge === 'hot' && <><Flame size={12} /> {t('badge.hot')}</>}
                {product.badge === 'new' && <><Sparkles size={12} /> {t('badge.new')}</>}
                {product.badge === 'sale' && <><Tag size={12} /> {t('badge.sale')}</>}
                {product.badge === 'popular' && <><TrendingUp size={12} /> {t('badge.popular')}</>}
                {product.badge === 'free' && <><Gift size={12} /> {t('badge.free')}</>}
              </span>
            )}
          </div>

          {/* Инфо */}
          <div style={{
            padding: '14px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
          }}>
            <h3 style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {l(product.title)}
            </h3>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {l(product.subtitle)}
            </p>

            {/* Рейтинг */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 8 }}>
              <Star size={13} fill="#fcab14" stroke="#fcab14" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{product.rating}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginLeft: 4 }}>{product.sold.toLocaleString(locale)} {t('product.sales')}</span>
            </div>

            {/* Цена */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
                {product.price === 0 ? t('product.free') : `${product.price} ₽`}
              </span>
              {product.oldPrice && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>
                  {product.oldPrice} ₽
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
