'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  /** Tailwind max-width class, e.g. "max-w-[480px]" */
  maxWidth?: string
}

/**
 * Shared modal shell: dimmed backdrop, Escape-to-close, body scroll lock,
 * focus-friendly dialog semantics and a consistent header/footer layout.
 */
export function Modal({ title, onClose, children, footer, maxWidth = 'max-w-[480px]' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative bg-[#151829] border border-line rounded-2xl w-full ${maxWidth} shadow-2xl overflow-hidden animate-modal-in`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Закрыть"
            className="w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex gap-3 px-6 py-4 border-t border-line">{footer}</div>}
      </div>
    </div>
  )
}
