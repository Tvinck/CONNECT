import { shadeColor } from '@/lib/utils'

type Status = 'online' | 'busy' | 'offline'

interface AvatarProps {
  initials: string
  color?: string
  size?: number
  ring?: boolean
  online?: boolean
  status?: Status
  className?: string
}

const STATUS_COLOR: Record<Status, string> = {
  online:  '#22C55E',
  busy:    '#F59E0B',
  offline: '#5A6188',
}

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

  // `status` takes precedence; `online` kept for backward compatibility.
  const dotStatus: Status | null = status ?? (online ? 'online' : null)

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full text-white font-semibold tracking-tight ${ring ? 'ring-2 ring-bg' : ''} ${className}`}
      style={style}
    >
      <span>{initials}</span>
      {dotStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-bg ${dotStatus === 'online' ? 'animate-pulse-dot' : ''}`}
          style={{ background: STATUS_COLOR[dotStatus] }}
        />
      )}
    </div>
  )
}
