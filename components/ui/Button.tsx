import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

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
        'inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 rounded-xl',
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
