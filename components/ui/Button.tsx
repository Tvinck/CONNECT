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
import { ButtonHTMLAttributes, useRef } from 'react'
import { useMousePosition } from '@/hooks/useMousePosition'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Default: 'primary'. */
  variant?: 'primary' | 'ghost' | 'outline'
  /** Height/padding tier. Default: 'md'. */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to enable mouse spotlight. Default: true. */
  enableGlow?: boolean
}

/**
 * Styled button wrapper. Renders a <button> element with consistent design tokens.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  enableGlow = true,
  className,
  children,
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const { x, y } = useMousePosition(ref)

  return (
    <button
      ref={ref}
      className={cn(
        'relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 transform hover:scale-[1.02] active:scale-95 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#07091A] disabled:opacity-40 disabled:cursor-not-allowed group',
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
      {/* Moderate Spotlight Glow following cursor */}
      {enableGlow && !props.disabled && (
        <span
          style={{
            position: 'absolute',
            top: y,
            left: x,
            width: '100px',
            height: '100px',
            transform: 'translate(-50%, -50%)',
            background: variant === 'primary'
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 75%)'
              : 'radial-gradient(circle, rgba(191, 241, 40, 0.08) 0%, transparent 75%)',
            pointerEvents: 'none',
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  )
}

