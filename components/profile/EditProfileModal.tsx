'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import type { User, UserStatus } from '@/types'

interface Props {
  profile: User
  onClose: () => void
  onSaved: (updated: User) => void
}

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online',  label: 'Онлайн',   color: '#22C55E' },
  { value: 'busy',    label: 'Занят',     color: '#F59E0B' },
  { value: 'offline', label: 'Офлайн',   color: '#5A6188' },
]

export function EditProfileModal({ profile, onClose, onSaved }: Props) {
  const { setUser } = useAuthStore()
  const supabase = createClient()

  const [fullName, setFullName] = useState(profile.full_name)
  const [position, setPosition] = useState(profile.position ?? '')
  const [status, setStatus]     = useState<UserStatus>(profile.status)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const save = async () => {
    if (!fullName.trim()) { setError('Имя не может быть пустым'); return }
    setSaving(true)
    setError('')
    const { data, error: dbErr } = await supabase
      .from('users')
      .update({ full_name: fullName.trim(), position: position.trim() || null, status })
      .eq('id', profile.id)
      .select()
      .single<User>()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) {
      setUser(data)
      onSaved(data)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#151829] border border-line rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">Редактировать профиль</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">
              Имя и фамилия
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Артём Кошелев"
              className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">
              Должность
            </label>
            <input
              value={position}
              onChange={e => setPosition(e.target.value)}
              placeholder="Генеральный директор"
              className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">
              Статус
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setStatus(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-[13px] font-medium transition-all ${
                    status === opt.value
                      ? 'border-accent/50 bg-accent/10 text-white'
                      : 'border-line bg-white/[0.02] text-mute hover:text-white hover:border-line2'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  )
}
