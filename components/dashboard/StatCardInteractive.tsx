'use client'

import { TiltCard } from '../ui/TiltCard'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useRef } from 'react'

export function StatCardInteractive({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { x, y } = useMousePosition(cardRef)

  return (
    <TiltCard className="h-full">
      <div 
        ref={cardRef} 
        className="relative overflow-hidden h-full group rounded-[24px] border border-line bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition-all duration-200 hover:border-line2 hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)]"
      >
        <span
          style={{
            position: 'absolute',
            top: y,
            left: x,
            width: '180px',
            height: '180px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(20,114,245,0.06) 0%, transparent 75%)',
            pointerEvents: 'none'
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </TiltCard>
  )
}
