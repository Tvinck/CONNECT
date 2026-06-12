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
        className="relative overflow-hidden h-full group rounded-[20px] border border-white/[0.04] bg-[#171821] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all hover:border-white/[0.08]"
      >
        <span
          style={{
            position: 'absolute',
            top: y,
            left: x,
            width: '180px',
            height: '180px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(191,241,40,0.06) 0%, transparent 75%)',
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
