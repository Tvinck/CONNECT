import { create } from 'zustand'

interface Toast {
  id: string
  title: string
  desc?: string
  tone: 'ok' | 'err' | 'warn' | 'accent'
}

interface UIState {
  toasts: Toast[]
  sidebarOpen: boolean
  addToast: (title: string, desc?: string, tone?: Toast['tone']) => void
  removeToast: (id: string) => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  sidebarOpen: false,
  addToast: (title, desc, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, title, desc, tone }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3800)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
