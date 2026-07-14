import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'База знаний' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
