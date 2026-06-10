/**
 * components/ui/ToastHost.tsx — Global toast notification renderer.
 *
 * Reads the `toasts` array from `useUIStore` and renders each notification
 * as a floating card in the bottom-right corner of the viewport.
 *
 * Features:
 *  - Four visual tones: ok (green), err (red), warn (amber), accent (blue).
 *  - Each toast includes an icon, title, optional description, and dismiss button.
 *  - Toasts animate in via `animate-toast-in` (keyframe in tailwind.config.ts).
 *  - Auto-dismissed after 3.8 s by the store — dismiss button removes immediately.
 *  - Returns null when the queue is empty to avoid an empty DOM node.
 *
 * Mount once in the root layout or the dashboard layout:
 *  <ToastHost />
 */

'use client'

import { useUIStore } from '@/store/ui'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

/** Icon, background, border, and text classes for each tone. */
const TONE_CONFIG = {
  ok:     { icon: CheckCircle,    bg: 'bg-ok/10',     border: 'border-ok/15',     text: 'text-ok',     accentBar: 'bg-ok' },
  err:    { icon: XCircle,        bg: 'bg-err/10',    border: 'border-err/15',    text: 'text-err',    accentBar: 'bg-err' },
  warn:   { icon: AlertTriangle,  bg: 'bg-warn/10',   border: 'border-warn/15',   text: 'text-warn',   accentBar: 'bg-warn' },
  accent: { icon: Info,           bg: 'bg-accent/10', border: 'border-accent/15', text: 'text-accent', accentBar: 'bg-accent' },
}

/**
 * Renders all active toast notifications from the UI store.
 * Mount this once at the app root level.
 */
export function ToastHost() {
  const { toasts, removeToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Уведомления"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((t) => {
        const cfg = TONE_CONFIG[t.tone] || TONE_CONFIG.accent
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            role={t.tone === 'err' ? 'alert' : 'status'}
            aria-live={t.tone === 'err' ? 'assertive' : 'polite'}
            className={`pointer-events-auto animate-toast-in relative flex items-start gap-3 pl-5 pr-4 py-3.5 rounded-2xl bg-white border border-[#E8E9F3] shadow-[0_8px_30px_rgba(0,0,0,0.12)] min-w-[320px] max-w-[420px] overflow-hidden`}
          >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.accentBar}`} />

            {/* Tone icon container */}
            <div className={`w-8 h-8 rounded-full ${cfg.bg} ${cfg.text} inline-flex items-center justify-center shrink-0`}>
              <Icon size={16} />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0 pr-2 pt-0.5">
              <div className="text-[14px] font-bold tracking-tight text-[#171821]">{t.title}</div>
              {t.desc && <div className="text-[12.5px] text-[#6b7280] mt-0.5 leading-snug">{t.desc}</div>}
            </div>

            {/* Manual dismiss button */}
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#9ca3af] hover:text-[#171821] w-6 h-6 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center shrink-0 transition-colors mt-0.5"
              aria-label="Закрыть"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
