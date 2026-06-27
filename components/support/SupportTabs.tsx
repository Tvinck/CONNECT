'use client'

import { useState } from 'react'
import { SupportClient } from './SupportClient'
import { GGSelDisputes } from './GGSelDisputes'

export function SupportTabs() {
  const [tab, setTab] = useState<'chats' | 'ggsel'>('chats')

  return (
    <>
      <div className="flex items-center gap-2 mb-4 p-1 bg-white/[0.02] border border-line rounded-xl w-fit shrink-0">
        <button
          onClick={() => setTab('chats')}
          className={`h-9 px-5 rounded-lg text-[13px] font-semibold transition-all ${
            tab === 'chats' ? 'bg-accent text-white shadow-sm' : 'text-mute hover:text-white'
          }`}
        >
          Чат Поддержки
        </button>
        <button
          onClick={() => setTab('ggsel')}
          className={`h-9 px-5 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-2 ${
            tab === 'ggsel' ? 'bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/30 shadow-sm' : 'text-mute hover:text-[#FF9900]'
          }`}
        >
          Споры GGSel
          <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#e63950] text-[10px] text-white font-bold tabular-nums">
            1
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'chats' ? (
          <SupportClient />
        ) : (
          <div className="p-4 bg-[#1C1D2A] border border-white/[0.04] rounded-2xl shadow-2xl h-full overflow-y-auto">
            <GGSelDisputes />
          </div>
        )}
      </div>
    </>
  )
}
