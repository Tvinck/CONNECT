import { shadeColor } from '@/lib/utils'

interface AvatarProps {
  initials: string
  color?: string
  size?: number
  ring?: boolean
  online?: boolean
  className?: string
}

export function Avatar({
  initials,
  color = '#1472F5',
  size = 36,
  ring = false,
  online = false,
  className = '',
}: AvatarProps) {
  const style = {
    width: size,
    height: size,
    background: `linear-gradient(135deg, ${color} 0%, ${shadeColor(color, -30)} 100%)`,
    fontSize: Math.max(10, size * 0.36),
    flexShrink: 0,
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full text-white font-semibold tracking-tight ${ring ? 'ring-2 ring-bg' : ''} ${className}`}
      style={style}
    >
      <span>{initials}</span>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ok ring-2 ring-bg animate-pulse-dot" />
      )}
    </div>
  )
}
