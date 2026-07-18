/* ═══════════════════════════════════════════════════════════
   Skeleton — Shimmer-скелетоны для loading states
   ═══════════════════════════════════════════════════════════ */

interface LineProps {
  width?: string | number
  height?: string | number
  radius?: string
}

/** Скелетон-линия (текст, заголовок) */
export function SkeletonLine({ width = '100%', height = 14, radius }: LineProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: radius || 'var(--r-xs)',
      }}
    />
  )
}

/** Скелетон-аватар (круг) */
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="skeleton"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
  )
}

/** Скелетон карточки товара */
export function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Изображение */}
      <div className="skeleton" style={{ height: 180, borderRadius: 'var(--r-xl) var(--r-xl) 0 0' }} />

      {/* Контент */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SkeletonLine width="75%" height={16} />
        <SkeletonLine width="50%" height={12} />
        <SkeletonLine width="40%" height={12} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <SkeletonLine width={70} height={22} radius="var(--r-xs)" />
          <SkeletonLine width={45} height={22} radius="var(--r-xs)" />
        </div>
        <div className="skeleton" style={{ height: 40, borderRadius: 'var(--r-md)', marginTop: 6 }} />
      </div>
    </div>
  )
}
