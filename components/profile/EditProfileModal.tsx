'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { auditLog } from '@/lib/audit'
import { getInitials, colorFor } from '@/lib/utils'
import type { User, UserStatus } from '@/types'

interface Props {
  profile: User
  onClose: () => void
  onSaved: (updated: User) => void
}

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online',  label: 'Онлайн', color: '#22C55E' },
  { value: 'busy',    label: 'Занят',  color: '#F59E0B' },
  { value: 'offline', label: 'Офлайн', color: '#5A6188' },
]

const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

export function EditProfileModal({ profile, onClose, onSaved }: Props) {
  const { setUser } = useAuthStore()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [fullName,    setFullName]    = useState(profile.full_name)
  const [position,    setPosition]    = useState(profile.position ?? '')
  const [status,      setStatus]      = useState<UserStatus>(profile.status)
  const [avatarUrl,   setAvatarUrl]   = useState(profile.avatar_url ?? '')
  const [uploading,   setUploading]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setError('Файл не более 3 МБ'); return }
    if (!file.type.startsWith('image/')) { setError('Только изображения'); return }

    const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const rawExt = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXT.includes(rawExt)) { setError('Формат не поддерживается. Используйте JPG, PNG или WebP'); return }

    setUploading(true); setError('')
    const ext  = rawExt === 'jpeg' ? 'jpg' : rawExt
    const path = `avatars/${profile.id}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (upErr) { setError(upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`
    setAvatarUrl(cacheBustedUrl)
    setUploading(false)
  }

  const save = async () => {
    if (!fullName.trim()) { setError('Имя не может быть пустым'); return }
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('users')
      .update({ full_name: fullName.trim(), position: position.trim() || null, status, avatar_url: avatarUrl || null })
      .eq('id', profile.id)
      .select()
      .single<User>()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) {
      setUser(data)
      onSaved(data)
      auditLog({ action: 'profile.update', entityType: 'user', entityId: profile.id })
    }
    onClose()
  }

  const initials = getInitials(fullName || profile.full_name)
  const color = colorFor(fullName || profile.full_name)

  return (
    <Modal
      title="Редактировать профиль"
      onClose={onClose}
      maxWidth="max-w-[440px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving || uploading}>Отмена</Button>
          <Button className="flex-1" onClick={save} disabled={saving || uploading}>
            {saving && <Loader2 size={15} className="animate-spin" />} Сохранить
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar initials={initials} color={color} size={64} src={avatarUrl || undefined} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand hover:bg-brand-hover inline-flex items-center justify-center shadow-lg transition-colors"
            >
              {uploading ? <Loader2 size={11} className="animate-spin text-[#171821]" /> : <Camera size={11} className="text-[#171821]" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold">{fullName || 'Имя'}</div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-[12px] text-accent hover:underline mt-0.5"
            >
              {uploading ? 'Загрузка...' : avatarUrl ? 'Изменить фото' : 'Загрузить фото'}
            </button>
            <div className="text-[10.5px] text-mute2 mt-0.5">JPG, PNG — до 3 МБ</div>
          </div>
        </div>

        <div>
          <label className={LABEL}>Имя и фамилия</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Иван Иванов" autoFocus className={FIELD} />
        </div>

        <div>
          <label className={LABEL}>Должность</label>
          <input value={position} onChange={e => setPosition(e.target.value)}
            placeholder="Генеральный директор" className={FIELD} />
        </div>

        <div>
          <label className={LABEL}>Статус</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setStatus(opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-[13px] font-medium transition-all ${
                  status === opt.value
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-line bg-bg text-mute hover:text-slate-800 hover:border-line2'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  )
}
