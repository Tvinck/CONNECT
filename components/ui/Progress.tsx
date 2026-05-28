'use client'

import { shadeColor } from '@/lib/utils'

interface ProgressProps {
  value: number
  color?: string
  height?: number
  showValue?: boolean
  label?: string
}

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
            <span className="text-xs text-white/80 font-mono">{value}%</span>
          )}
        </div>
      )}
      <div
        className="relative w-full rounded-full overflow-hidden bg-white/[0.04]"
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
