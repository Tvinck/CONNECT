import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CONNECT — BAZZAR Group',
  description: 'Внутренняя платформа команды BAZZAR Group',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg text-white antialiased">
        {children}
      </body>
    </html>
  )
}
