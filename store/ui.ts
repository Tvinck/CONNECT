/**
 * store/ui.ts — Zustand store for transient UI state.
 *
 * Manages:
 *  - Toast notifications: auto-dismissed after 3.8 s, stacked in an array.
 *  - Mobile sidebar open/close toggle.
 *
 * Usage:
 *  const { addToast } = useUIStore()
 *  addToast('Сохранено', 'Изменения применены', 'ok')
 *
 * The store is not persisted — all state resets on page reload.
 */

import { create } from 'zustand'

/** A single toast notification entry. */
interface Toast {
  /** Unique ID generated at creation, used to remove the toast on dismiss. */
  id: string
  /** Short headline shown in bold. */
  title: string
  /** Optional secondary line with more detail. */
  desc?: string
  /** Visual tone: ok = green, err = red, warn = amber, accent = blue. */
  tone: 'ok' | 'err' | 'warn' | 'accent'
}

interface UIState {
  /** Stack of active toast notifications (rendered oldest-first). */
  toasts: Toast[]
  /** Whether the mobile sidebar drawer is open. */
  sidebarOpen: boolean

  /**
   * Creates and queues a toast notification.
   * It is automatically removed after 3.8 seconds.
   *
   * @param title — primary message
   * @param desc  — optional detail line
   * @param tone  — colour tone (default: 'ok')
   */
  addToast: (title: string, desc?: string, tone?: Toast['tone']) => void

  /** Immediately removes a toast by its ID (e.g. on manual dismiss). */
  removeToast: (id: string) => void

  /** Opens or closes the mobile sidebar drawer. */
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  sidebarOpen: false,

  addToast: (title, desc, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, title, desc, tone }] }))
    // Auto-dismiss after 3.8 s so successful actions clear themselves.
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3800)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
