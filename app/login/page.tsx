'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logomark } from '@/components/ui/Logomark'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  
  const [email, setEmail] = useState('')
  const [pwd, setPwd]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [emailError, setEmailError] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [generalError, setGeneralError] = useState('')

  // Mouse coordinates tracking for parallax background glow blobs
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

  // Reverse transform for the second blob
  const reverseSpringX = useTransform(springX, (val) => -val)
  const reverseSpringY = useTransform(springY, (val) => -val)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('error') === 'profile_missing') {
        setGeneralError('Ошибка профиля: Ваша учетная запись авторизована в Auth, но профиль не найден в базе данных. Сессия сброшена.')
        supabase.auth.signOut().then(() => {
          router.refresh()
        })
      }
    }
  }, [supabase, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let hasError = false
    
    if (!email.trim()) {
      setEmailError('Введи логин или email')
      hasError = true
    } else {
      setEmailError('')
    }

    if (!pwd) {
      setPwdError('Введи пароль')
      hasError = true
    } else {
      setPwdError('')
    }

    if (hasError) return

    setLoading(true)
    setGeneralError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pwd,
    })

    if (error) {
      setGeneralError(
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
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full flex flex-col items-center justify-between py-12 px-4 bg-[#0F1017] text-white relative overflow-hidden"
    >
      {/* Background ambient glows (purple + lime green) with moderate parallax mouse movement */}
      <motion.div 
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.12] pointer-events-none" 
        style={{ x: springX, y: springY, background: '#BFF128' }} 
      />
      <motion.div 
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-[0.08] pointer-events-none" 
        style={{ x: reverseSpringX, y: reverseSpringY, background: '#8E92BC' }} 
      />

      {/* Top Brand Logo */}
      <div className="relative z-10 flex flex-col items-center select-none pt-4">
        {/* Soft background ambient glow under the logo */}
        <div 
          className="absolute inset-[-10px] rounded-full blur-[24px] opacity-[0.35] pointer-events-none scale-75"
          style={{ background: 'radial-gradient(circle, rgba(191,241,40,0.6) 0%, rgba(191,241,40,0) 70%)' }}
        />
        <Logomark size="lg" className="text-white relative z-10 drop-shadow-[0_2px_12px_rgba(255,255,255,0.18)]" />
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="relative z-10 w-full max-w-[460px] bg-[#171821] rounded-[32px] p-9 border border-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.4)]"
      >
        <h2 className="text-[28px] font-extrabold tracking-tight text-white mb-6">
          Вход
        </h2>

        {/* Segmented Control Tabs */}
        <div className="grid grid-cols-2 bg-[#222431] p-[3.5px] rounded-[15px] mb-7">
          <button 
            type="button" 
            className="bg-[#BFF128] text-black font-extrabold py-2.5 text-center rounded-[12px] text-[13.5px] shadow-[0_2px_8px_rgba(191,241,40,0.15)] transition-all"
          >
            Логин и пароль
          </button>
          <button 
            type="button" 
            className="text-[#8E92BC] font-semibold py-2.5 text-center rounded-[12px] text-[13.5px] cursor-not-allowed opacity-60 transition-all"
            disabled
          >
            С ключом доступа
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Email / Login Input */}
          <div className="relative">
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError('')
              }}
              className={`w-full h-[56px] px-4 rounded-[14px] outline-none text-[15px] transition-all border-2 ${
                emailError 
                  ? 'bg-[#3C1A22] border-[#FF4D4D] text-white placeholder:text-[#FF4D4D]/60' 
                  : 'bg-[#222431] border-transparent focus:border-[#BFF128] focus:bg-[#1A1C27] text-white placeholder:text-[#5A5D7F]'
              }`}
              placeholder="Логин или email"
            />
            {emailError && (
              <div className="text-[12px] text-[#FF4D4D] mt-1.5 pl-1 font-medium">
                {emailError}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={pwd}
              onChange={(e) => {
                setPwd(e.target.value)
                if (pwdError) setPwdError('')
              }}
              className={`w-full h-[56px] pl-4 pr-12 rounded-[14px] outline-none text-[15px] transition-all border-2 ${
                pwdError 
                  ? 'bg-[#3C1A22] border-[#FF4D4D] text-white placeholder:text-[#FF4D4D]/60' 
                  : 'bg-[#222431] border-transparent focus:border-[#BFF128] focus:bg-[#1A1C27] text-white placeholder:text-[#5A5D7F]'
              }`}
              placeholder="Пароль"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-4 top-[18px] text-[#5A5D7F] hover:text-[#BFF128] transition-colors"
            >
              {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {pwdError && (
              <div className="text-[12px] text-[#FF4D4D] mt-1.5 pl-1 font-medium">
                {pwdError}
              </div>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="pt-1">
            <a 
              href="/forgot-password" 
              className="text-[14px] text-[#8E92BC] hover:text-[#BFF128] font-semibold transition-colors"
            >
              Не помню пароль
            </a>
          </div>

          {/* General Error (e.g. invalid credentials) */}
          {generalError && (
            <div className="px-4 py-3 rounded-[14px] bg-[#3C1A22] border border-[#FF4D4D]/20 text-[#FF4D4D] text-[13.5px] font-medium leading-relaxed">
              {generalError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[56px] rounded-[16px] bg-[#BFF128] hover:bg-[#C9F735] active:bg-[#AEDD1E] text-black font-black text-[15.5px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(191,241,40,0.12)] hover:shadow-[0_4px_24px_rgba(191,241,40,0.25)] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Продолжить'
            )}
          </button>
        </form>
      </motion.div>

      {/* Empty Footer Spacer */}
      <div className="pb-4" />
    </div>
  )
}

