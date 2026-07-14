'use client'

import { useState } from 'react'
import { Search, Zap, Loader2, X, Save, User } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useUIStore } from '@/store/ui'
import { useAuthStore } from '@/store/auth'
import { updatePixelUserBalance } from '@/app/actions/pixelActions'
import { getInitials, colorFor } from '@/lib/utils'

interface PixelUsersProps {
  initialUsers: any[]
}

export function PixelUsers({ initialUsers }: PixelUsersProps) {
  const [users, setUsers] = useState<any[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [newBalance, setNewBalance] = useState('')
  const [updating, setUpdating] = useState(false)
  const addToast = useUIStore(s => s.addToast)

  const role = useAuthStore(s => s.role)
  const canEdit = role === 'ceo' || role === 'coowner'

  const filteredUsers = users.filter(u =>
    (u.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.telegram_id || '').toString().includes(searchQuery) ||
    u.id.includes(searchQuery)
  )

  const handleStartEdit = (user: any) => {
    setEditingUserId(user.id)
    setNewBalance(user.balance.toString())
  }

  const handleSaveBalance = async (userId: string) => {
    const val = parseInt(newBalance, 10)
    if (isNaN(val) || val < 0) {
      addToast('Ошибка', 'Введите корректное число больше или равное 0', 'err')
      return
    }

    setUpdating(true)
    try {
      await updatePixelUserBalance(userId, val)
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, balance: val } : u))
      )
      setEditingUserId(null)
      addToast('Успешно', 'Баланс пользователя обновлен', 'ok')
    } catch (e: any) {
      addToast('Ошибка', e.message || 'Не удалось обновить баланс', 'err')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-[16px] font-semibold">Пользователи Pixel AI</h3>
        <div className="relative">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени/username/Telegram ID..."
            className="h-9 pl-9 pr-3 rounded-xl border border-line bg-bg/40 text-[12.5px] outline-none w-64 focus:border-accent/60 transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-mute2" />
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <EmptyState icon={User} title="Пользователи не найдены" description="Попробуйте изменить поисковый запрос." />

        ) : (
          filteredUsers.map(u => (
            <div
              key={u.id}
              className="p-3.5 rounded-xl border border-line/50 bg-bg hover:bg-black/[0.02] transition-colors flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  initials={getInitials(u.first_name || u.username || 'User')}
                  color={colorFor(u.username || u.first_name || u.id)}
                  size={38}
                  src={u.avatar_url}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-[13.5px] text-slate-800 flex items-center gap-2">
                    <span>{u.first_name || 'Пользователь'} {u.last_name || ''}</span>
                    {u.is_premium && (
                      <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-mute2 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    {u.username && <span>@{u.username}</span>}
                    {u.username && <span className="text-line">•</span>}
                    <span>TG ID: {u.telegram_id || 'нет'}</span>
                    <span className="text-line">•</span>
                    <span>Генераций: {u.total_gens}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editingUserId === u.id && canEdit ? (
                  <div className="flex items-center gap-1 bg-bg border border-line rounded-lg p-1">
                    <input
                      type="number"
                      autoFocus
                      className="w-16 h-8 px-2 bg-transparent text-right outline-none text-[13px] text-slate-800 font-mono font-bold"
                      value={newBalance}
                      disabled={updating}
                      onChange={e => setNewBalance(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveBalance(u.id)
                        if (e.key === 'Escape') setEditingUserId(null)
                      }}
                    />
                    <button
                      onClick={() => handleSaveBalance(u.id)}
                      disabled={updating}
                      className="w-8 h-8 rounded-lg bg-ok/10 hover:bg-ok/20 text-ok transition-colors flex items-center justify-center"
                    >
                      {updating ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingUserId(null)}
                      disabled={updating}
                      className="w-8 h-8 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-mute hover:text-slate-800 transition-colors flex items-center justify-center"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : canEdit ? (
                  <button
                    onClick={() => handleStartEdit(u)}
                    className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg border border-accent/25 transition-all text-accent group"
                  >
                    <Zap size={13} className="fill-current text-accent" />
                    <span className="text-[12.5px] font-bold font-mono">
                      {u.balance} ⚡
                    </span>
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-1.5 bg-black/[0.04] px-3 py-1.5 rounded-lg border border-line/40 text-mute2 cursor-default"
                  >
                    <Zap size={13} className="text-mute2" />
                    <span className="text-[12.5px] font-bold font-mono text-mute">
                      {u.balance} ⚡
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
