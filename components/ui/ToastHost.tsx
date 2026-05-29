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
  ok:     { icon: CheckCircle,    bg: 'bg-ok/15',     border: 'border-ok/30',     text: 'text-ok' },
  err:    { icon: XCircle,        bg: 'bg-err/15',    border: 'border-err/30',    text: 'text-err' },
  warn:   { icon: AlertTriangle,  bg: 'bg-warn/15',   border: 'border-warn/30',   text: 'text-warn' },
  accent: { icon: Info,           bg: 'bg-accent/15', border: 'border-accent/30', text: 'text-accent' },
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
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((t) => {
        const cfg = TONE_CONFIG[t.tone]
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            role={t.tone === 'err' ? 'alert' : 'status'}
            aria-live={t.tone === 'err' ? 'assertive' : 'polite'}
            className={`pointer-events-auto animate-toast-in flex items-start gap-3 px-4 py-3.5 rounded-2xl glass border ${cfg.border} shadow-2xl min-w-[300px] max-w-[400px]`}
          >
            {/* Tone icon */}
            <div className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.text} inline-flex items-center justify-center shrink-0`}>
              <Icon size={16} />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold tracking-tight">{t.title}</div>
              {t.desc && <div className="text-[11.5px] text-mute mt-0.5">{t.desc}</div>}
            </div>

            {/* Manual dismiss button */}
            <button
              onClick={() => removeToast(t.id)}
              className="text-mute hover:text-white w-6 h-6 inline-flex items-center justify-center shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
