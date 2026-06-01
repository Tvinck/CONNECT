'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html>
      <body>
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center"
          style={{ background: '#07091A', color: '#fff', fontFamily: 'sans-serif' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={28} style={{ color: '#EF4444' }} />
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Что-то пошло не так</h2>
            <p style={{ fontSize: 13.5, color: '#8B92B4', maxWidth: 380 }}>
              {error.message || 'Произошла непредвиденная ошибка. Попробуйте обновить страницу.'}
            </p>
            {error.digest && (
              <p style={{ fontSize: 11, color: '#5A607A', fontFamily: 'monospace', marginTop: 8 }}>
                Код: {error.digest}
              </p>
            )}
          </div>

          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 20px',
              height: 44,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} /> Попробовать снова
          </button>
        </div>
      </body>
    </html>
  )
}
