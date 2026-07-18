'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Error boundary для секций BazzarSerts 2.0.
 * Показывается при ошибке загрузки данных из Supabase.
 */
export default function B2SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="card p-8 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-err/10 text-err inline-flex items-center justify-center">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-[18px] font-bold tracking-tight">Ошибка загрузки</h2>
        <p className="text-[13px] text-mute leading-relaxed">
          Не удалось загрузить данные раздела. Проверьте подключение к интернету
          или попробуйте обновить страницу.
        </p>
        {error?.message && (
          <code className="text-[11px] text-mute2 bg-black/[0.03] px-3 py-1.5 rounded-lg max-w-full overflow-hidden text-ellipsis">
            {error.message}
          </code>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-[#171821] text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          <RefreshCw size={14} />
          Попробовать снова
        </button>
      </div>
    </div>
  )
}
