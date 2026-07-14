/**
 * components/ui/EmptyState.tsx — Shared empty-state block.
 *
 * One consistent look for "nothing here yet" / "no results" across the app:
 * a soft icon tile, a title, an optional hint line, and an optional action
 * (usually a Button). Pass either a lucide `icon` or an `emoji`.
 */

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  /** Lucide icon component (takes precedence over emoji). */
  icon?: LucideIcon
  /** Emoji fallback when no icon is supplied. */
  emoji?: string
  title: string
  description?: string
  /** Optional call-to-action, typically a <Button>. */
  action?: ReactNode
  /** Extra classes on the outer wrapper. */
  className?: string
}

export function EmptyState({ icon: Icon, emoji, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-bg border border-line inline-flex items-center justify-center text-mute2 mb-4">
        {Icon ? <Icon size={24} /> : <span className="text-2xl leading-none">{emoji ?? '📭'}</span>}
      </div>
      <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h3>
      {description && <p className="text-[13px] text-mute mt-1.5 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
