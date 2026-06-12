'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { getInitials, colorFor } from '@/lib/utils'
import { Search, Send, Check, CheckCheck, User, Users, Shield, Info, Copy, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import clsx from 'clsx'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
/**
 * Компонент мессенджера поддержки.
 * Отвечает за:
 * 1. Получение списка диалогов из `support_messages`.
 * 2. Общение с выбранным клиентом в реальном времени.
 * 3. Отображение деталей профиля пользователя (подписки, рефералы).
 * 
 * Взаимодействует с БД проекта Veil VPN через клиент `createVeilClient`.
 * 
 * @returns {JSX.Element} Интерфейс CRM (3 колонки: чаты, диалог, профиль).
 */
export function SupportClient() {
  const [chats, setChats] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [userDetails, setUserDetails] = useState<any | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [debugText, setDebugText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  /**
   * Загружает уникальные чаты (пользователей) из БД.
   * Выбирает последние сообщения и группирует их на стороне клиента,
   * так как Supabase JS Client не поддерживает сложный GROUP BY.
   */
  const fetchChats = async () => {
    // To get unique chats we can fetch latest messages. 
    // Supabase standard doesn't support GROUP BY easily in JS client, 
    // so we'll fetch all messages sorted by desc and manually group.
    // In production, an RPC or view is better.
    const msgsResponse = await supabase
      .from('support_messages')
      .select('*, vpn_subscriptions(id, username, telegram_username)')
      .order('created_at', { ascending: false })
      .limit(500)
    
    const msgs: any[] = msgsResponse.data || []
    const error = msgsResponse.error

    if (error) {
      console.error('SupportClient fetchChats error:', error)
      setDebugText(`Error: ${error.message}`)
    } else {
      setDebugText(`Msgs fetched: ${msgs?.length || 0}`)
    }

    if (msgs) {
      const map = new Map()
      msgs.forEach(m => {
        if (!map.has(m.user_id)) {
          map.set(m.user_id, {
            userId: m.user_id,
            profile: m.vpn_subscriptions,
            lastMessage: m.message,
            time: m.created_at,
            isRead: m.is_read || m.is_from_user === false,
            project: m.project
          })
        }
      })
      setChats(Array.from(map.values()))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchChats()

    const channel = supabase
      .channel('support_messages_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        fetchChats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Загружает историю сообщений для выбранного пользователя.
   * Также подписывается на новые сообщения (INSERT) через Supabase Realtime,
   * чтобы мгновенно обновлять переписку на экране.
   */
  useEffect(() => {
    if (!selectedUser) return
    
    const fetchMsgs = async () => {
      const { error } = await supabase
        .from('support_messages')
        .update({ is_read: true } as any)
        .eq('user_id', selectedUser.userId)
        .eq('is_from_user', true)
        .eq('is_read', false)
      
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', selectedUser.userId)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data as any[])
    }
    fetchMsgs()

    const channel = supabase
      .channel(`support_messages_${selectedUser.userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${selectedUser.userId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser])

  /**
   * Загружает детали профиля клиента (подписки и рефералы)
   * при выборе чата. Используется для правой колонки.
   */
  useEffect(() => {
    if (!selectedUser) return
    
    const fetchDetails = async () => {
      const { data: subs } = await supabase
        .from('vpn_subscriptions')
        .select('*')
        .eq('user_id', selectedUser.userId)
      
      setUserDetails({ subs: subs || [], refCount: 0 })
    }
    fetchDetails()
  }, [selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /**
   * Отправляет новое сообщение от лица техподдержки в БД.
   * Telegram-бот (слушая БД через Realtime) перешлет его клиенту.
   */
  const handleSend = async () => {
    if (!text.trim() || !selectedUser) return
    setSending(true)
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: selectedUser.userId,
        message: text.trim(),
        is_from_user: false,
        is_read: true,
        project: selectedUser.project || 'Veil VPN'
      } as any)
      .select()
      .single()
    try {
      setText('')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">
      {/* Left Column: Chats */}
      <div className="w-[300px] shrink-0 flex flex-col bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/[0.04]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5D7F]" size={16} />
            <input 
              type="text" 
              placeholder="Поиск..." 
              className="w-full bg-[#13141C] border border-white/[0.04] rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none focus:border-[#BFF128]/50 transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[#5A5D7F]"><Loader2 className="animate-spin" size={20} /></div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-[#5A5D7F]">
              Нет сообщений <br/>
              <span className="text-[10px] text-red-500">{debugText}</span>
            </div>
          ) : (
            chats.map(chat => {
              const isActive = selectedUser?.userId === chat.userId
              const name = chat.profile?.username || chat.profile?.telegram_username || 'Неизвестный'
              return (
                <div 
                  key={chat.userId} 
                  onClick={() => setSelectedUser(chat)}
                  className={clsx(
                    "px-4 py-3 cursor-pointer border-b border-white/[0.02] transition-colors flex gap-3",
                    isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                  )}
                >
                  <Avatar initials={getInitials(name)} color={colorFor(name)} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-[13px] font-semibold truncate text-white">{name}</h4>
                      <span className="text-[10px] text-[#5A5D7F]">
                        {format(new Date(chat.time), 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={clsx("text-[12px] truncate flex-1", !chat.isRead ? "text-white font-medium" : "text-[#5A5D7F]")}>
                        {chat.lastMessage}
                      </p>
                      {!chat.isRead && (
                        <div className="w-2 h-2 rounded-full bg-[#e63950]"></div>
                      )}
                    </div>
                    <span className="text-[9px] uppercase font-bold text-[#BFF128] mt-1 block tracking-wider">{chat.project}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Middle Column: Chat */}
      <div className="flex-1 flex flex-col bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-hidden shadow-2xl relative">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-[#5A5D7F] text-[13px]">
            Выберите чат слева
          </div>
        ) : (
          <>
            <div className="h-[60px] border-b border-white/[0.04] flex items-center px-6 justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <Avatar 
                  initials={getInitials(selectedUser.profile?.username || selectedUser.profile?.telegram_username)} 
                  color={colorFor(selectedUser.profile?.username || selectedUser.profile?.telegram_username)} 
                  size={32} 
                />
                <div>
                  <h3 className="text-[14px] font-bold">{selectedUser.profile?.username || selectedUser.profile?.telegram_username || 'Неизвестный'}</h3>
                  <p className="text-[11px] text-[#5A5D7F]">Проект: <span className="text-white">{selectedUser.project}</span></p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => {
                const isMine = !msg.is_from_user
                return (
                  <div key={msg.id} className={clsx("flex flex-col max-w-[70%]", isMine ? "ml-auto items-end" : "mr-auto items-start")}>
                    <div className={clsx(
                      "px-4 py-2.5 rounded-2xl text-[13.5px] leading-[1.4] shadow-sm",
                      isMine ? "bg-[#BFF128] text-black rounded-tr-none" : "bg-[#252736] text-white rounded-tl-none border border-white/[0.02]"
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-[#5A5D7F] mt-1.5 flex items-center gap-1">
                      {format(new Date(msg.created_at), 'HH:mm')}
                      {isMine && <CheckCheck size={12} className="text-[#BFF128]" />}
                    </span>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/[0.04] bg-white/[0.01]">
              <div className="flex gap-2 relative">
                <textarea 
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите сообщение..." 
                  className="w-full bg-[#13141C] border border-white/[0.06] rounded-xl pl-4 pr-12 py-3 text-[13px] outline-none focus:border-[#BFF128]/50 transition-colors resize-none max-h-[120px] min-h-[44px]"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-[#BFF128] text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#aade1f] transition-colors"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
                </button>
              </div>
              <p className="text-[10px] text-[#5A5D7F] text-center mt-2">Enter для отправки, Shift+Enter для переноса</p>
            </div>
          </>
        )}
      </div>

      {/* Right Column: User Info */}
      <div className="w-[300px] shrink-0 bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-y-auto shadow-2xl p-5 space-y-6">
        {!selectedUser ? (
          <div className="flex h-full items-center justify-center text-[#5A5D7F] text-[13px] text-center">
            Выберите чат для просмотра деталей клиента
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center">
              <Avatar 
                initials={getInitials(selectedUser.profile?.username || selectedUser.profile?.telegram_username)} 
                color={colorFor(selectedUser.profile?.username || selectedUser.profile?.telegram_username)} 
                size={80} 
                className="mx-auto mb-3"
              />
              <h2 className="text-[16px] font-bold text-white mb-1">
                {selectedUser.profile?.username || selectedUser.profile?.telegram_username || 'Неизвестный'}
              </h2>
              {selectedUser.profile?.telegram_username && (
                <p className="text-[13px] text-[#BFF128] font-medium">@{selectedUser.profile.telegram_username}</p>
              )}
            </div>

            {/* Referrals */}
            <div className="bg-[#13141C] border border-white/[0.04] rounded-xl p-4">
              <h3 className="text-[11px] uppercase tracking-wider text-[#5A5D7F] font-bold mb-3 flex items-center gap-2">
                <Users size={14} /> Рефералы
              </h3>
              <div className="text-[24px] font-black">{userDetails?.refCount || 0}</div>
              <p className="text-[11px] text-[#5A5D7F] mt-1">Приглашенных друзей</p>
            </div>

            {/* Subscriptions */}
            <div>
              <h3 className="text-[11px] uppercase tracking-wider text-[#5A5D7F] font-bold mb-3 flex items-center gap-2">
                <Shield size={14} /> Подписки
              </h3>
              
              {!userDetails ? (
                <Loader2 size={16} className="animate-spin text-[#5A5D7F]" />
              ) : userDetails.subs?.length === 0 ? (
                <p className="text-[12px] text-[#5A5D7F]">Нет активных подписок</p>
              ) : (
                <div className="space-y-3">
                  {userDetails.subs.map((sub: any, i: number) => {
                    const isActive = sub.status === 'active'
                    return (
                      <div key={sub.id} className="bg-[#13141C] border border-white/[0.04] rounded-xl p-3 relative overflow-hidden">
                        <div className={clsx(
                          "absolute top-0 left-0 w-1 h-full", 
                          isActive ? "bg-[#22c55e]" : "bg-[#e63950]"
                        )} />
                        <div className="pl-2">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-[12.5px] font-semibold">Устройство {i + 1}</div>
                            <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", isActive ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#e63950]/20 text-[#e63950]")}>
                              {isActive ? 'Active' : 'Expired'}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 text-[11.5px] text-[#8E92BC]">
                            <div className="flex justify-between">
                              <span>Трафик:</span>
                              <span className="text-white">{sub.traffic_limit ? Math.round(sub.traffic_limit / 1073741824) + ' ГБ' : 'Безлимит'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Истекает:</span>
                              <span className="text-white">{sub.expires_at ? format(new Date(sub.expires_at), 'dd.MM.yyyy') : 'Бессрочно'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
          </>
        )}
      </div>
    </div>
  )
}
