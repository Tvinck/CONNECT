/**
 * components/ui/Avatar.tsx — Circular avatar with initials and optional status dot.
 *
 * Generates a gradient background from the supplied `color` prop (derived
 * deterministically from the user's name via `colorFor` in utils.ts).
 *
 * Status dot colours:
 *  - online  → green  (#22C55E), pulsing animation
 *  - busy    → amber  (#F59E0B)
 *  - offline → grey   (#5A6188)
 *
 * The `online` boolean prop is kept for backwards-compatibility but the
 * `status` string prop takes precedence when both are provided.
 */

import { shadeColor } from '@/lib/utils'

type Status = 'online' | 'busy' | 'offline'

interface AvatarProps {
  /** One or two initials rendered inside the circle (use `getInitials` from utils). */
  initials: string
  /** Hex background gradient base colour. Default: accent blue (#1472F5). */
  color?: string
  /** Diameter in pixels. Default: 36. */
  size?: number
  /** Show a 2px ring in the page background colour (useful when overlapping avatars). */
  ring?: boolean
  /** @deprecated Use `status="online"` instead. */
  online?: boolean
  /** Current presence status — renders a coloured dot indicator. */
  status?: Status
  /** Extra Tailwind classes applied to the outer wrapper. */
  className?: string
}

/** Colours for the status indicator dot. */
const STATUS_COLOR: Record<Status, string> = {
  online:  '#22C55E',
  busy:    '#F59E0B',
  offline: '#5A6188',
}

/**
 * Renders a circular avatar with initials and an optional presence indicator dot.
 */
export function Avatar({
  initials,
  color = '#1472F5',
  size = 36,
  ring = false,
  online = false,
  status,
  className = '',
}: AvatarProps) {
  const style = {
    width: size,
    height: size,
    background: `linear-gradient(135deg, ${color} 0%, ${shadeColor(color, -30)} 100%)`,
    fontSize: Math.max(10, size * 0.36),
    flexShrink: 0,
  }

  // `status` prop takes precedence; fall back to legacy `online` boolean.
  const dotStatus: Status | null = status ?? (online ? 'online' : null)

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full text-white font-semibold tracking-tight ${ring ? 'ring-2 ring-bg' : ''} ${className}`}
      style={style}
    >
      <span>{initials}</span>
      {dotStatus && (
        <span
          aria-label={dotStatus === 'online' ? 'Онлайн' : dotStatus === 'busy' ? 'Занят' : 'Не в сети'}
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-bg ${dotStatus === 'online' ? 'animate-pulse-dot' : ''}`}
          style={{ background: STATUS_COLOR[dotStatus] }}
        />
      )}
    </div>
  )
}
