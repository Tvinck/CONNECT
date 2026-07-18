import { Loader2 } from 'lucide-react'

/**
 * Скелетон-лоадер для секций BazzarSerts 2.0.
 * Показывается пока серверный компонент загружает данные из Supabase.
 */
export default function B2SectionLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* KPI tiles skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-3 w-20 bg-black/[0.06] rounded mb-3" />
            <div className="h-7 w-24 bg-black/[0.08] rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="card p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 size={18} className="animate-spin text-mute" />
          <div className="h-4 w-32 bg-black/[0.06] rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 bg-black/[0.05] rounded flex-1" />
              <div className="h-4 w-20 bg-black/[0.05] rounded" />
              <div className="h-4 w-16 bg-black/[0.05] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
