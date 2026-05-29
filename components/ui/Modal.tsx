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

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  /** Title shown in the modal header. Also used as aria-label. */
  title: string
  /** Called when the user closes the modal (backdrop click, Escape, or X). */
  onClose: () => void
  /** Main content of the modal body. */
  children: React.ReactNode
  /** Optional footer slot — rendered below a divider. Typically holds action buttons. */
  footer?: React.ReactNode
  /** Tailwind max-width utility class, e.g. "max-w-[480px]". Default: "max-w-[480px]". */
  maxWidth?: string
}

/**
 * Renders a centred modal dialog with backdrop, keyboard support, and scroll lock.
 */
export function Modal({ title, onClose, children, footer, maxWidth = 'max-w-[480px]' }: ModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — click anywhere outside the panel to dismiss */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative bg-[#151829] border border-line rounded-2xl w-full ${maxWidth} shadow-2xl overflow-hidden animate-modal-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer — only rendered when provided */}
        {footer && (
          <div className="flex gap-3 px-6 py-4 border-t border-line">{footer}</div>
        )}
      </div>
    </div>
  )
}
