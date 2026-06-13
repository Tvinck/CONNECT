/**
 * components/ui/Modal.tsx — Reusable modal dialog shell.
 *
 * Provides:
 *  - Dimmed, blurred backdrop that closes on click.
 *  - Escape key listener that calls onClose.
 *  - Body scroll-lock while open (restores previous overflow value on unmount).
 *  - ARIA role="dialog" / aria-modal / aria-label for screen readers.
 *  - Consistent header (title + X button) and optional footer slot.
 *
 * All feature modals across the app (create task, add client, invite employee,
 * new article, etc.) are built on top of this shell instead of duplicating
 * the overlay/close/scroll-lock logic each time.
 *
 * Usage:
 *  <Modal title="Заголовок" onClose={() => setOpen(false)} footer={<Buttons />}>
 *    {form content}
 *  </Modal>
 */

'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  /** Optional title shown in the modal header. Also used as aria-label. */
  title?: string
  /** Called when the user closes the modal (backdrop click, Escape, or X). */
  onClose: () => void
  /** Main content of the modal body. */
  children: React.ReactNode
  /** Optional footer slot — rendered below a divider. Typically holds action buttons. */
  footer?: React.ReactNode
  /** Tailwind max-width utility class, e.g. "max-w-[480px]". Default: "max-w-[480px]". */
  maxWidth?: string
  /** Custom CSS classes for the main dialog wrapper. */
  className?: string
}

/**
 * Renders a centred modal dialog with backdrop, keyboard support, and scroll lock.
 */
export function Modal({ title, onClose, children, footer, maxWidth = 'w-[95vw] max-w-5xl', className }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Close on Escape key press.
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)

    // Prevent the page content behind the modal from scrolling.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop — click anywhere outside the panel to dismiss */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Диалоговое окно'}
        className={className || `relative bg-card text-[#171821] border border-line rounded-2xl w-full ${maxWidth} flex flex-col shadow-2xl animate-modal-in my-auto`}
      >
        {/* Header — only rendered if title is provided */}
        {title && (
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-line">
            <h2 className="text-[16px] font-bold tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="w-8 h-8 rounded-lg text-mute hover:text-[#171821] hover:bg-bg transition-all inline-flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={className ? '' : 'px-6 py-5 overflow-y-auto min-h-0'}>{children}</div>

        {/* Footer — only rendered when provided */}
        {footer && (
          <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-line">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  )
}
