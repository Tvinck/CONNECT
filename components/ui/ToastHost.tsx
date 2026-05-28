'use client'

import { useUIStore } from '@/store/ui'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const TONE_CONFIG = {
  ok:     { icon: CheckCircle,    bg: 'bg-ok/15',     border: 'border-ok/30',     text: 'text-ok' },
  err:    { icon: XCircle,        bg: 'bg-err/15',    border: 'border-err/30',    text: 'text-err' },
  warn:   { icon: AlertTriangle,  bg: 'bg-warn/15',   border: 'border-warn/30',   text: 'text-warn' },
  accent: { icon: Info,           bg: 'bg-accent/15', border: 'border-accent/30', text: 'text-accent' },
}

export function ToastHost() {
  const { toasts, removeToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => {
        const cfg = TONE_CONFIG[t.tone]
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            className={`pointer-events-auto animate-toast-in flex items-start gap-3 px-4 py-3.5 rounded-2xl glass border ${cfg.border} shadow-2xl min-w-[300px] max-w-[400px]`}
          >
            <div className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.text} inline-flex items-center justify-center shrink-0`}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold tracking-tight">{t.title}</div>
              {t.desc && <div className="text-[11.5px] text-mute mt-0.5">{t.desc}</div>}
            </div>
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
