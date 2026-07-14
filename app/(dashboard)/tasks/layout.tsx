import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Задачи' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
