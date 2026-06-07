/**
 * components/ui/Button.tsx — Base button component.
 *
 * Three visual variants:
 *  - primary  — filled blue with glow; used for the main action in a form/modal.
 *  - ghost    — transparent with subtle border; used for secondary actions.
 *  - outline  — transparent with brighter border; used in toolbars/filters.
 *
 * Three sizes: sm (h-8), md (h-9, default), lg (h-11).
 *
 * All standard <button> props (onClick, disabled, type, etc.) pass through.
 * Extra Tailwind classes can be added via `className`.
 */

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Default: 'primary'. */
  variant?: 'primary' | 'ghost' | 'outline'
  /** Height/padding tier. Default: 'md'. */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Styled button wrapper. Renders a <button> element with consistent design tokens.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 transform hover:scale-105 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#07091A] disabled:opacity-40 disabled:cursor-not-allowed',
        {
          'bg-accent hover:bg-[#2A82FF] text-white shadow-glow': variant === 'primary',
          'border border-line hover:border-line2 bg-white/[0.02] hover:bg-white/[0.04] text-mute hover:text-white': variant === 'ghost',
          'border border-line2 bg-transparent hover:bg-white/[0.04] text-white': variant === 'outline',
        },
        {
          'h-8 px-3 text-xs': size === 'sm',
          'h-9 px-4 text-[13px]': size === 'md',
          'h-11 px-5 text-sm': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
