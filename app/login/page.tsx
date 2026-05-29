'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logomark } from '@/components/ui/Logomark'
import { Progress } from '@/components/ui/Progress'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

const PROJECTS = [
  { id: 'podari', name: 'ПодариМомент',  emoji: '🎁', color: '#1472F5', progress: 80  },
  { id: 'pixel',  name: 'PIXEL',         emoji: '✨', color: '#FF4D9D', progress: 35  },
  { id: 'bazzar', name: 'BAZZAR MARKET', emoji: '🛒', color: '#22C55E', progress: 12  },
]

export default function LoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [pwd, setPwd]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pwd,
    })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Неверная почта или пароль'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] relative overflow-hidden"
      style={{ background: 'radial-gradient(1200px 600px at 0% 0%, #1A2148 0%, #0A0E27 45%, #060926 100%)' }}
    >
      {/* Blobs */}
      <div className="blob" style={{ width: 520, height: 520, background: '#1472F5', top: -120, left: -80 }} />
      <div className="blob" style={{ width: 420, height: 420, background: '#00C2FF', bottom: -120, left: 160, opacity: 0.35 }} />
      <div className="blob" style={{ width: 380, height: 380, background: '#1472F5', top: '40%', left: '38%', opacity: 0.18 }} />

      {/* Left panel */}
      <div className="relative px-12 lg:px-20 py-14 flex flex-col justify-between grid-bg hidden lg:flex">
        <Logomark size="lg" />

        <div className="relative z-10 max-w-[560px]">
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-white/[0.04] border border-line text-[11px] text-mute mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-dot" />
            <span className="tracking-[0.12em] uppercase">внутренний доступ · v 2.4</span>
          </div>
          <h1 className="text-[52px] leading-[1.02] font-bold tracking-tight">
            Платформа для<br />
            <span className="bg-gradient-to-r from-white to-cyan bg-clip-text text-transparent">
              команды BAZZAR Group
            </span>
          </h1>
          <p className="text-[17px] text-mute mt-6 leading-relaxed max-w-[480px]">
            Тихое место, где рождаются проекты. Зашёл → глянул задачи → поработал → ушёл.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-[460px]">
            {PROJECTS.map((p) => (
              <div key={p.id} className="card card-tight p-4">
                <div className="text-[22px] mb-2">{p.emoji}</div>
                <div className="text-[12.5px] font-semibold tracking-tight">{p.name}</div>
                <div className="text-[10.5px] text-mute mt-2 font-mono">{p.progress}% готовности</div>
                <div className="mt-2"><Progress value={p.progress} color={p.color} height={3} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11.5px] text-mute2 flex items-center gap-6">
          <span>© 2026 BAZZAR Group</span>
          <span className="hover:text-mute cursor-pointer">Политика безопасности</span>
          <span className="hover:text-mute cursor-pointer">Поддержка</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="relative flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-[420px] relative z-10">
          <div className="glass rounded-2xl p-8">
            <div className="lg:hidden mb-6">
              <Logomark />
            </div>

            <h2 className="text-[26px] font-bold tracking-tight">С возвращением 👋</h2>
            <p className="text-[13.5px] text-mute mt-1.5">
              Рады видеть снова. Введите корпоративную почту BAZZAR.
            </p>

            <div className="mt-7 space-y-3">
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

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-mute2 font-semibold">Пароль</span>
                  <a href="/forgot-password" className="text-[11.5px] text-accent hover:text-cyan transition-colors">
                    Забыли пароль?
                  </a>
                </div>
                <div className="relative mt-2">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="field field-icon pr-11"
                    placeholder="Введите пароль"
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
            </div>

            {error && (
              <div className="mt-3 px-3 py-2.5 rounded-xl bg-err/10 border border-err/30 text-err text-[12.5px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full h-12 rounded-xl bg-accent hover:bg-[#2A82FF] text-white font-semibold text-[14px] tracking-tight shadow-glow inline-flex items-center justify-center gap-2 disabled:opacity-70 transition-all duration-200"
            >
              {loading ? (
                <span className="text-[13px]">Подключение…</span>
              ) : (
                <>Войти <ArrowRight size={16} /></>
              )}
            </button>

            <div className="mt-5 pt-5 border-t border-line text-[11.5px] text-mute2 flex items-center justify-between">
              <span>Доступ только для сотрудников</span>
              <span className="inline-flex items-center gap-1"><Lock size={11} /> SSO защищён</span>
            </div>
          </div>

          <div className="mt-4 text-center text-[11.5px] text-mute2">
            Нет аккаунта? Спроси у CEO <span className="text-[13px]">😉</span>
          </div>
        </form>
      </div>
    </div>
  )
}
