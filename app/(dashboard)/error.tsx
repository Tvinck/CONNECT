/**
 * app/(dashboard)/error.tsx — Error boundary for the dashboard layout.
 *
 * Next.js renders this automatically when any Server or Client Component inside
 * the dashboard segment throws an uncaught error. The `reset` function re-renders
 * the failing segment so the user can retry without a full page reload.
 *
 * Must be a Client Component (Next.js requirement for error boundaries).
 */

'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  /** The error that was thrown. */
  error: Error & { digest?: string }
  /** Retries the failed segment render. */
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    // Log to an external error tracking service here if needed (e.g. Sentry).
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-err/10 border border-err/20 inline-flex items-center justify-center">
        <AlertTriangle size={28} className="text-err" />
      </div>

      {/* Message */}
      <div>
        <h2 className="text-[22px] font-bold tracking-tight mb-2">Что-то пошло не так</h2>
        <p className="text-[13.5px] text-mute max-w-[380px]">
          Произошла ошибка при загрузке этой страницы. Попробуйте обновить или вернитесь назад.
        </p>
        {error.digest && (
          <p className="text-[11px] text-mute2 font-mono mt-2">Код: {error.digest}</p>
        )}
      </div>

      {/* Action */}
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-white/[0.06] border border-line hover:border-line2 hover:bg-white/[0.08] text-[13px] font-semibold transition-all"
      >
        <RefreshCw size={15} /> Попробовать снова
      </button>
    </div>
  )
}
