'use client'

import { useState } from 'react'
import { BazzarReviewsPanel } from '@/components/projects/ProjectDetail/BazzarReviewsPanel'
import { BazzarTicketsPanel } from '@/components/projects/ProjectDetail/BazzarTicketsPanel'

// Репутация: отзывы + претензии/тикеты. Обе панели самодостаточны (сами грузят).
export function ReputationSection() {
  const [tab, setTab] = useState<'reviews' | 'claims'>('reviews')
  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-5">
      <h1 className="text-[22px] font-bold tracking-tight">Репутация</h1>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setTab('reviews')} className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold ${tab === 'reviews' ? 'bg-brand text-[#171821]' : 'text-mute hover:bg-black/[0.04]'}`}>Отзывы</button>
        <button onClick={() => setTab('claims')} className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold ${tab === 'claims' ? 'bg-brand text-[#171821]' : 'text-mute hover:bg-black/[0.04]'}`}>Претензии</button>
      </div>
      {tab === 'reviews' ? <BazzarReviewsPanel /> : <BazzarTicketsPanel />}
    </div>
  )
}
