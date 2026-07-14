'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logomark } from '@/components/ui/Logomark'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function ForgotPasswordPage() {
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Mouse coordinates tracking for parallax background blobs
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 60, damping: 22 })
  const springY = useSpring(y, { stiffness: 60, damping: 22 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return
    const moveX = (e.clientX - window.innerWidth / 2) / 30
    const moveY = (e.clientY - window.innerHeight / 2) / 30
    x.set(moveX)
    y.set(moveY)
  }

  const reverseSpringX = useTransform(springX, (val) => -val)
  const reverseSpringY = useTransform(springY, (val) => -val)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Always show success — don't leak which emails exist.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full flex items-center justify-center p-8 relative overflow-hidden text-white"
      style={{ background: 'radial-gradient(1200px 600px at 50% 50%, #1A2148 0%, #0A0E27 60%, #060926 100%)' }}
    >
      <motion.div 
        className="blob pointer-events-none" 
        style={{ x: springX, y: springY, width: 480, height: 480, background: '#1472F5', top: -100, right: -100, opacity: 0.45 }} 
      />
      <motion.div 
        className="blob pointer-events-none" 
        style={{ x: reverseSpringX, y: reverseSpringY, width: 380, height: 380, background: '#00C2FF', bottom: -100, left: -100, opacity: 0.3 }} 
      />

      <div className="w-full max-w-[420px] relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="glass rounded-2xl p-8"
        >
          <div className="mb-6">
            <Logomark />
          </div>

          {!sent ? (
            <>
              <h2 className="text-[26px] font-bold tracking-tight">Бывает. Сейчас починим 🔧</h2>
              <p className="text-[13.5px] text-mute mt-1.5">
                Введи корпоративную почту — пришлём ссылку для входа.
              </p>

              <form onSubmit={submit} className="mt-7 space-y-3">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-mute2 font-semibold">Почта</span>
                  <div className="relative mt-2">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field field-icon"
                      placeholder="you@bazzar.group"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-[#171821] font-semibold text-[14px] shadow-glow-lime transition-all disabled:opacity-70"
                >
                  {loading ? 'Отправляем…' : 'Отправить ссылку'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-[48px] mb-4">📬</div>
              <h2 className="text-[22px] font-bold tracking-tight">Письмо отправлено!</h2>
              <p className="text-[13.5px] text-mute mt-2">
                Проверь почту <span className="text-white font-medium">{email}</span> — там будет ссылка для входа.
              </p>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-line">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[12.5px] text-mute hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Вернуться ко входу
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
