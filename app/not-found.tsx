/**
 * app/not-found.tsx — Custom 404 page.
 *
 * Shown by Next.js whenever `notFound()` is called from a Server Component
 * or when a route simply doesn't exist.
 */

import Link from 'next/link'
import { Logomark } from '@/components/ui/Logomark'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 text-center"
      style={{ background: 'radial-gradient(800px 600px at 50% 0%, #1A2148 0%, #0A0E27 60%, #060926 100%)' }}
    >
      <Logomark />

      {/* Giant number */}
      <div className="relative">
        <div
          className="text-[160px] sm:text-[200px] font-black leading-none tabular-nums tracking-tighter"
          style={{
            background: 'linear-gradient(135deg, #1472F5 0%, #00C2FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </div>
        {/* Glow behind the text */}
        <div
          className="absolute inset-0 -z-10 blur-[80px] opacity-30"
          style={{ background: 'radial-gradient(closest-side, #1472F5, transparent)' }}
        />
      </div>

      <div>
        <h1 className="text-[26px] font-bold tracking-tight mb-3">Страница не найдена</h1>
        <p className="text-[14px] text-mute max-w-[360px]">
          Такой страницы не существует или она была перемещена.
          Вернитесь на главную и начните заново.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-accent hover:bg-[#2A82FF] text-white font-semibold text-[14px] tracking-tight shadow-glow transition-all duration-200"
      >
        На главную
      </Link>
    </div>
  )
}
