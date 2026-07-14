/**
 * components/ui/Tag.tsx — Inline status/label badge.
 *
 * Used throughout the app to display:
 *  - Task priorities and statuses
 *  - Client statuses (Лид, Активный, VIP, Ушёл)
 *  - Permission levels in the access matrix
 *  - User roles
 *
 * The `tone` prop maps to a colour set defined by Tailwind design tokens:
 *  accent → blue, ok → green, warn → amber, err → red, gold → yellow, mute → grey, cyan → cyan
 */

import { cn } from '@/lib/utils'

type Tone = 'accent' | 'cyan' | 'ok' | 'warn' | 'err' | 'gold' | 'mute'

interface TagProps {
  /** Colour tone. Default: 'mute'. */
  tone?: Tone
  children: React.ReactNode
  /** Extra Tailwind classes. */
  className?: string
}

/** Tailwind class strings for each tone. */
const tones: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent border-accent/30',
  cyan:   'bg-cyan/15 text-cyan border-cyan/30',
  ok:     'bg-ok/15 text-ok border-ok/30',
  warn:   'bg-warn/15 text-warn border-warn/30',
  err:    'bg-err/15 text-err border-err/30',
  gold:   'bg-gold/15 text-gold border-gold/30',
  mute:   'bg-mute/10 text-mute border-line',
}

/**
 * Renders a small pill-shaped badge with a coloured background/border/text.
 */
export function Tag({ tone = 'mute', children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 h-6 rounded-lg text-[11px] font-medium border tracking-tight',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
