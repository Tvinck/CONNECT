import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Headphones, X, Send, Paperclip } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   SupportChat — Виджет поддержки с spring-анимацией
   ═══════════════════════════════════════════════════════════ */

interface ChatMessage {
  id: number
  from: string
  text: string
  time: string
  image?: string
}

export function SupportChat() {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const now = () => new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  const baseMessages = (): ChatMessage[] => [
    { id: 1, from: 'support', text: t('chat.mock1'), time: '19:00' },
    { id: 2, from: 'support', text: t('chat.mock2'), time: '19:00' },
  ]

  const openChat = () => {
    setMessages(prev => (prev.length === 0 ? baseMessages() : prev))
    setOpen(true)
  }

  const autoReply = (text: string, delay: number) => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'support',
        text,
        time: now(),
      }])
    }, delay)
  }

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        from: 'user',
        text: '',
        image: reader.result as string,
        time: now(),
      }])
      autoReply(t('chat.replyScreenshot'), 1500)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, {
      id: Date.now(),
      from: 'user',
      text: input.trim(),
      time: now(),
    }])
    setInput('')
    // Автоответ
    autoReply(t('chat.replyMessage'), 1200)
  }

  const QUICK: { q: string; a: string }[] = [
    { q: t('chat.q1'), a: t('chat.a1') },
    { q: t('chat.q2'), a: t('chat.a2') },
    { q: t('chat.q3'), a: t('chat.a3') },
    { q: t('chat.q4'), a: t('chat.a4') },
  ]

  return (
    <>
      {/* Кнопка чата */}
      <div className="chat-btn">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={openChat}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--gradient)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            cursor: 'pointer',
          }}
          aria-label={t('chat.openAria')}
        >
          <Headphones size={22} />
        </motion.button>

      </div>

      {/* Окно чата */}
      <AnimatePresence>
        {open && (
          <>
            {/* Оверлей (mobile) */}
            <motion.div
              className="overlay desktop-hide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="chat-window"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                position: 'fixed',
                bottom: 96,
                right: 24,
                width: 380,
                height: 500,
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 1500,
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              {/* Хедер чата */}
              <div style={{
                padding: '16px 20px',
                background: 'var(--gradient-subtle)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                    {t('chat.title')}
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                    {t('chat.online')}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--r-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--surface-2)',
                    color: 'var(--text-2)',
                  }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Сообщения */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                    }}
                  >
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: msg.from === 'user'
                        ? 'var(--r-md) var(--r-md) var(--r-xs) var(--r-md)'
                        : 'var(--r-md) var(--r-md) var(--r-md) var(--r-xs)',
                      background: msg.from === 'user' ? 'var(--accent-1)' : 'var(--surface-2)',
                      color: msg.from === 'user' ? '#fff' : 'var(--text)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}>
                      {msg.image ? (
                        <img src={msg.image} alt={t('chat.imageAlt')} style={{
                          maxWidth: '100%', borderRadius: 8, display: 'block',
                        }} />
                      ) : msg.text}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 4, display: 'block', textAlign: msg.from === 'user' ? 'right' : 'left' }}>
                      {msg.time}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Быстрые ответы */}
              {messages.length <= 3 && (
                <div style={{
                  padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap',
                  borderTop: '1px solid var(--border)',
                }}>
                  {QUICK.map(({ q, a }) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setMessages(prev => [...prev, {
                          id: Date.now(),
                          from: 'user',
                          text: q,
                          time: now(),
                        }])
                        autoReply(a, 1000)
                      }}
                      style={{
                        padding: '5px 12px', borderRadius: 'var(--r-full)',
                        background: 'rgba(149,51,255,0.08)', border: '1px solid rgba(149,51,255,0.2)',
                        color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 200ms', whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(149,51,255,0.15)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(149,51,255,0.08)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Ввод */}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage() }}
                style={{
                  padding: 12,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  className="field"
                  type="text"
                  placeholder={t('chat.inputPlaceholder')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{ flex: 1, borderRadius: 'var(--r-full)', padding: '10px 16px', fontSize: '0.85rem' }}
                />
                {/* Прикрепить файл */}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAttach} />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 40, height: 40, borderRadius: 'var(--r-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--surface-2)', color: 'var(--text-3)',
                    border: '1px solid var(--border)', flexShrink: 0,
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  title={t('chat.attachTitle')}
                >
                  <Paperclip size={16} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="submit"
                  className="btn btn-gradient"
                  style={{ padding: '10px 14px', borderRadius: 'var(--r-full)' }}
                >
                  <Send size={16} />
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
