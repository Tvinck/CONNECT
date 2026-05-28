import { cn } from '@/lib/utils'

type Tone = 'accent' | 'cyan' | 'ok' | 'warn' | 'err' | 'gold' | 'mute'

interface TagProps {
  tone?: Tone
  children: React.ReactNode
  className?: string
}

const tones: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent border-accent/30',
  cyan:   'bg-cyan/15 text-cyan border-cyan/30',
  ok:     'bg-ok/15 text-ok border-ok/30',
  warn:   'bg-warn/15 text-warn border-warn/30',
  err:    'bg-err/15 text-err border-err/30',
  gold:   'bg-gold/15 text-gold border-gold/30',
  mute:   'bg-white/[0.05] text-mute border-line',
}

export function Tag({ tone = 'mute', children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-[11px] font-medium border tracking-tight',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
