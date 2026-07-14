/**
 * components/ui/Progress.tsx — Animated horizontal progress bar.
 *
 * Renders a track filled to `value` percent with a gradient that glows
 * in the fill colour. The fill animates in via the `progress-fill` CSS class
 * (defined in globals.css: `transform-origin: left; animation: fillin 900ms`).
 *
 * Used in:
 *  - Project cards (completion %)
 *  - Profile page (XP progress to next level)
 *  - Achievement cards
 */

import { shadeColor } from '@/lib/utils'

interface ProgressProps {
  /** Fill percentage, 0–100. Values outside this range are clamped. */
  value: number
  /** Base hex colour for the gradient. Default: accent blue (#1472F5). */
  color?: string
  /** Track height in pixels. Default: 6. */
  height?: number
  /** Show the numeric percentage label on the right. Default: false. */
  showValue?: boolean
  /** Optional text label displayed on the left above the bar. */
  label?: string
}

/**
 * Renders an animated progress bar with optional label and value display.
 */
export function Progress({
  value,
  color = '#1472F5',
  height = 6,
  showValue = false,
  label = '',
}: ProgressProps) {
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-xs text-mute">{label}</span>}
          {showValue && (
            <span className="text-xs text-mute font-mono">{value}%</span>
          )}
        </div>
      )}
      <div
        className="relative w-full rounded-full overflow-hidden bg-line2"
        style={{ height }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${shadeColor(color, 30)} 100%)`,
            boxShadow: `0 0 16px -2px ${color}80`,
          }}
        />
      </div>
    </div>
  )
}
