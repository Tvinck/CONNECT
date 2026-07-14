import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Поддержка' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
