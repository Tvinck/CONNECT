'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logomark } from '@/components/ui/Logomark'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [pwd, setPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwd.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password: pwd })
    if (error) {
      setError('Ссылка устарела. Запроси новую на странице входа.')
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-8 relative overflow-hidden text-white"
      style={{ background: 'radial-gradient(1200px 600px at 50% 50%, #1A2148 0%, #0A0E27 60%, #060926 100%)' }}
    >
      <div className="blob" style={{ width: 480, height: 480, background: '#1472F5', top: -100, right: -100, opacity: 0.45 }} />
      <div className="blob" style={{ width: 380, height: 380, background: '#00C2FF', bottom: -100, left: -100, opacity: 0.3 }} />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="glass rounded-2xl p-8">
          <div className="mb-6"><Logomark /></div>

          {!done ? (
            <>
              <h2 className="text-[26px] font-bold tracking-tight">Новый пароль 🔑</h2>
              <p className="text-[13.5px] text-mute mt-1.5">
                Придумай новый пароль для входа в CONNECT.
              </p>

              <form onSubmit={submit} className="mt-7 space-y-3">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-mute2 font-semibold">Новый пароль</span>
                  <div className="relative mt-2">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      className="field field-icon pr-11"
                      placeholder="Минимум 6 символов"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-white transition-colors"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {error && (
                  <div className="px-3 py-2.5 rounded-xl bg-err/10 border border-err/30 text-err text-[12.5px]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-accent hover:bg-[#2A82FF] text-white font-semibold text-[14px] shadow-glow transition-all disabled:opacity-70"
                >
                  {loading ? 'Сохраняем…' : 'Сохранить пароль'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-[48px] mb-4">✅</div>
              <h2 className="text-[22px] font-bold tracking-tight">Готово!</h2>
              <p className="text-[13.5px] text-mute mt-2">Пароль обновлён. Перенаправляем…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
