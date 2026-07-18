'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'

/**
 * Диагональный водяной знак поверх всего экрана: имя+логин сотрудника и
 * дата/время. Полупрозрачный (незаметно в работе, но видно на скриншотах),
 * pointer-events: none — не мешает взаимодействию. Помогает отследить утечку
 * скринов. Время обновляется раз в 30 секунд.
 */
export function Watermark() {
  const { user } = useAuthStore()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (!user || !now) return null

  const stamp = now.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const label = `${user.full_name || 'сотрудник'} · ${user.email || ''} · ${stamp}`

  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', opacity: 0.06 }}>
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="b2-watermark" width="460" height="180" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
            <text x="0" y="90" fill="#0b1220" fontSize="13" fontWeight="600" fontFamily="var(--font-outfit), system-ui, sans-serif">
              {label}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#b2-watermark)" />
      </svg>
    </div>
  )
}
