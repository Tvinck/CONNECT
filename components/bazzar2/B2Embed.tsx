import type { ReactNode } from 'react'

// Обёртка раздела BazzarSerts 2.0: одинаковые поля + заголовок + встроенная панель.
export function B2Embed({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
        {subtitle ? <span className="text-[13px] text-mute">{subtitle}</span> : null}
      </div>
      {children}
    </div>
  )
}
