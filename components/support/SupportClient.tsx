'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [activeSub, setActiveSub] = useState<any | null>(null)
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
    if (!selectedUser) {
      setActiveSub(null)
      setUserDetails(null)
      return
    }
    
    const fetchDetails = async () => {
      let mainSub = null;
      let subs = [];
      
      // 1. Сначала пробуем получить основную подписку по UUID (userId)
      const { data: subByUuid } = await supabase
        .from('vpn_subscriptions')
        .select('*')
        .eq('id', selectedUser.userId)
        .maybeSingle()
        
      if (subByUuid) {
        mainSub = subByUuid;
        setActiveSub(subByUuid);
        const { data: subsByUsername } = await supabase
          .from('vpn_subscriptions')
          .select('*')
          .eq('username', subByUuid.username);
        subs = subsByUsername || [subByUuid];
      } else {
        const fallbackUsername = selectedUser.profile?.username;
        if (fallbackUsername) {
          const { data: subsByFallback } = await supabase
            .from('vpn_subscriptions')
            .select('*')
            .eq('username', fallbackUsername);
          
          if (subsByFallback && subsByFallback.length > 0) {
            mainSub = subsByFallback[0];
            setActiveSub(subsByFallback[0]);
            subs = subsByFallback;
          }
        }
      }

      if (mainSub) {
        const email = mainSub.username || '';
        const isEmail = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email);

        let connectUser = null;
        let projects: any[] = [];
        let connectClient = null;

        if (isEmail) {
          const [userRes, clientRes] = await Promise.all([
            supabase
              .from('users')
              .select('id, email, full_name, role, created_at')
              .eq('email', email)
              .maybeSingle(),
            supabase
              .from('clients')
              .select('*, manager:users!manager_id(full_name)')
              .eq('email', email)
              .maybeSingle()
          ]);

          if (userRes.data) {
            connectUser = userRes.data;
            const { data: mems } = await supabase
              .from('project_members')
              .select('role, projects(name, slug)')
              .eq('user_id', userRes.data.id);
            if (mems) {
              projects = mems;
            }
          }

          if (clientRes.data) {
            connectClient = clientRes.data;
          }
        }

        setUserDetails({
          subs: subs,
          refCount: 0,
          connectUser,
          projects,
          connectClient,
          email: isEmail ? email : null
        });
      } else {
        setActiveSub(null);
        setUserDetails({ subs: [], refCount: 0, connectUser: null, projects: [], email: null });
      }
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
  const { user } = useAuthStore()
  const [templateSearch, setTemplateSearch] = useState('')

  const QUICK_TEMPLATES = [
    { 
      title: 'Продление подписки', 
      text: 'Здравствуйте! Для продления подписки вы можете приобрести новый ключ на GGsel, либо перейти на наш сайт: https://www.veil-vps.online/ для продления текущего.' 
    },
    { 
      title: 'Не работает ВПН', 
      text: 'Здравствуйте! Если VPN не подключается, пожалуйста: 1) Перезагрузите приложение; 2) Попробуйте сменить сеть с Wi-Fi на сотовую связь; 3) Проверьте лимит трафика в личном кабинете.' 
    },
    { 
      title: 'Инструкция iOS', 
      text: 'Для настройки на iOS (iPhone): 1. Установите V2rayTUN / Shadowrocket из App Store. 2. Скопируйте ваш ключ доступа из личного кабинета. 3. Откройте приложение и добавьте ключ. 4. Нажмите Подключить.' 
    },
    { 
      title: 'Инструкция Android', 
      text: 'Для настройки на Android: 1. Установите v2rayNG из Google Play. 2. Скопируйте ваш ключ. 3. В приложении нажмите кнопку "+" -> "Импортировать профиль из буфера обмена". 4. Выберите его и подключитесь.' 
    },
    { 
      title: 'Инструкция PC', 
      text: 'Для ПК (Windows): Установите клиент Nekoray, скопируйте ваш ключ доступа и импортируйте его. Включите режим "Системный прокси".' 
    },
    {
      title: 'Проверить транзакции',
      text: 'Пожалуйста, пришлите номер заказа с сайта GGsel или чек об оплате, чтобы мы могли проверить вашу транзакцию.'
    }
  ]

  /**
   * Отправляет новое сообщение от лица техподдержки в БД.
   * Сохраняет email отправителя (сотрудника) для информирования коллег в Telegram.
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
        project: selectedUser.project || 'Veil VPN',
        sender_email: user?.email || 'unknown'
      } as any)
      .select()
      .single()
    try {
      setText('')
    } finally {
      setSending(false)
    }
  }

  /**
   * Продлевает выбранную подписку пользователя на 30 дней в базе данных.
   * 
   * @param {any} sub - Объект подписки, которую необходимо продлить
   */
  const handleExtendSubscription = async (sub: any) => {
    if (!sub || !sub.id) return
    if (!confirm(`Продлить подписку на 30 дней для устройства с ключом ${sub.subscription_key.slice(0, 8)}...?`)) return
    
    setSending(true)
    try {
      const currentExpires = new Date(sub.expires_at)
      const baseDate = currentExpires > new Date() ? currentExpires : new Date()
      const newExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      const { error } = await supabase
        .from('vpn_subscriptions')
        .update({
          expires_at: newExpiresAt.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id)
        
      if (error) throw error
      
      alert('Подписка успешно продлена на 30 дней!')
      
      // Обновляем состояние выбранного пользователя для перезапуска загрузки данных
      if (selectedUser) {
        setSelectedUser({ ...selectedUser })
      }
    } catch (err: any) {
      console.error(err)
      alert(`Ошибка продления: ${err.message}`)
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

  const filteredTemplates = QUICK_TEMPLATES.filter(
    t => t.title.toLowerCase().includes(templateSearch.toLowerCase()) || 
         t.text.toLowerCase().includes(templateSearch.toLowerCase())
  )

  const displayName = selectedUser?.profile?.username || activeSub?.username || selectedUser?.profile?.telegram_username || activeSub?.telegram_username || 'Неизвестный'
  const tgName = selectedUser?.profile?.telegram_username || activeSub?.telegram_username

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">
      {/* Left Column: Chats */}
      <div className="w-[300px] shrink-0 flex flex-col bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/[0.04]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E92BC]" size={16} />
            <input 
              type="text" 
              placeholder="Поиск..." 
              className="w-full bg-[#13141C] border border-white/[0.04] rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none placeholder:text-[#8E92BC]/60 focus:border-[#BFF128]/50 transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[#8E92BC]"><Loader2 className="animate-spin" size={20} /></div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-[#8E92BC]">
              Нет сообщений <br/>
              <span className="text-[10px] text-red-500">{debugText}</span>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.04 }
                }
              }}
            >
              {chats.map(chat => {
                const isActive = selectedUser?.userId === chat.userId
                const name = chat.profile?.username || chat.profile?.telegram_username || 'Неизвестный'
                return (
                  <motion.div 
                    key={chat.userId} 
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
                    }}
                    whileHover={{ scale: 1.01, x: 2 }}
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
                        <span className="text-[10px] text-[#8E92BC]">
                          {format(new Date(chat.time), 'HH:mm')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className={clsx("text-[12px] truncate flex-1", !chat.isRead ? "text-white font-medium" : "text-[#8E92BC]")}>
                          {chat.lastMessage}
                        </p>
                        {!chat.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[#e63950]"></div>
                        )}
                      </div>
                      <span className="text-[9px] uppercase font-bold text-[#BFF128] mt-1 block tracking-wider">{chat.project}</span>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Middle Column: Chat */}
      <div className="flex-1 flex flex-col bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-hidden shadow-2xl relative">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-[#8E92BC] text-[13px]">
            Выберите чат слева
          </div>
        ) : (
          <>
            <div className="h-[60px] border-b border-white/[0.04] flex items-center px-6 justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <Avatar 
                  initials={getInitials(displayName)} 
                  color={colorFor(displayName)} 
                  size={32} 
                />
                <div>
                  <h3 className="text-[14px] font-bold text-white">{displayName}</h3>
                  <p className="text-[11px] text-[#8E92BC]">Проект: <span className="text-white font-medium">{selectedUser.project}</span></p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isMine = !msg.is_from_user
                  return (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                      className={clsx("flex flex-col max-w-[70%]", isMine ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      <div className={clsx(
                        "px-4 py-2.5 rounded-2xl text-[13.5px] leading-[1.4] shadow-sm",
                        isMine ? "bg-[#BFF128] text-black rounded-tr-none" : "bg-[#252736] text-white rounded-tl-none border border-white/[0.02]"
                      )}>
                        {msg.message.startsWith('📷 [Изображение]:') ? (
                          <div className="space-y-1">
                            <img 
                              src={msg.message.split('📷 [Изображение]: ')[1]} 
                              alt="Вложение" 
                              className="max-w-[240px] max-h-[180px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                              onClick={() => window.open(msg.message.split('📷 [Изображение]: ')[1], '_blank')} 
                            />
                          </div>
                        ) : (
                          msg.message
                        )}
                      </div>
                      <span className="text-[10px] text-[#8E92BC] mt-1.5 flex items-center gap-1">
                        {format(new Date(msg.created_at), 'HH:mm')}
                        {isMine && <CheckCheck size={12} className="text-[#BFF128]" />}
                      </span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/[0.04] bg-white/[0.01]">
              <div className="flex gap-2 relative">
                <textarea 
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите сообщение..." 
                  className="w-full bg-[#13141C] border border-white/[0.06] rounded-xl pl-4 pr-12 py-3 text-[13px] text-white placeholder-[#8E92BC]/60 outline-none focus:border-[#BFF128]/50 transition-colors resize-none max-h-[120px] min-h-[44px]"
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
              <p className="text-[10px] text-[#8E92BC] text-center mt-2">Enter для отправки, Shift+Enter для переноса</p>
            </div>
          </>
        )}
      </div>

      {/* Right Column: User Info */}
      <div className="w-[300px] shrink-0 bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-y-auto shadow-2xl p-5 space-y-6">
        {!selectedUser ? (
          <div className="flex h-full items-center justify-center text-[#8E92BC] text-[13px] text-center">
            Выберите чат для просмотра деталей клиента
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center">
              <Avatar 
                initials={getInitials(displayName)} 
                color={colorFor(displayName)} 
                size={80} 
                className="mx-auto mb-3"
              />
              <h2 className="text-[16px] font-bold text-white mb-1">
                {displayName}
              </h2>
              {tgName && (
                <p className="text-[13px] text-[#BFF128] font-medium">@{tgName}</p>
              )}
            </div>

            {/* Registration & Connect Info */}
            <div className="bg-[#13141C] border border-white/[0.04] rounded-xl p-4 space-y-3">
              <h3 className="text-[11px] uppercase tracking-wider text-[#8E92BC] font-bold flex items-center gap-2">
                <Info size={14} /> Учетная запись
              </h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[#8E92BC] shrink-0">Email / Логин:</span>
                  <span className="text-white font-mono truncate max-w-[140px] text-right" title={userDetails?.email || 'не указан'}>
                    {userDetails?.email || 'не указан'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E92BC]">Veil VPN:</span>
                  <span className={clsx("font-semibold", activeSub ? "text-green-500" : "text-[#8E92BC]")}>
                    {activeSub ? 'Зарегистрирован' : 'Нет подписки'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E92BC]">Аккаунт Connect:</span>
                  <span className={clsx("font-semibold", userDetails?.connectUser ? "text-[#BFF128]" : "text-[#8E92BC]")}>
                    {userDetails?.connectUser ? 'Да' : 'Нет'}
                  </span>
                </div>
                {userDetails?.connectUser && (
                  <>
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-[#8E92BC] shrink-0">ФИО:</span>
                      <span className="text-white text-right truncate max-w-[160px]">{userDetails.connectUser.full_name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E92BC]">Роль:</span>
                      <span className="text-[#BFF128] uppercase text-[10px] font-bold bg-white/5 px-1.5 py-0.5 rounded">
                        {userDetails.connectUser.role || 'user'}
                      </span>
                    </div>
                  </>
                )}
                {userDetails?.projects && userDetails.projects.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[#8E92BC] block mb-1">Доступ к проектам:</span>
                    <div className="flex flex-wrap gap-1">
                      {userDetails.projects.map((p: any) => (
                        <span key={p.projects?.slug} className="text-[10px] bg-white/5 border border-white/10 text-white px-2 py-0.5 rounded-md">
                          {p.projects?.name || p.projects?.slug}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {userDetails?.connectClient && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <span className="text-[#8E92BC] block mb-1">Профиль CRM-Клиента:</span>
                    <div className="space-y-1.5 text-[11.5px] pl-1">
                      <div className="flex justify-between">
                        <span className="text-[#8E92BC]">Имя в CRM:</span>
                        <span className="text-white font-semibold">{userDetails.connectClient.name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8E92BC]">Источник:</span>
                        <span className="text-white">{userDetails.connectClient.source || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8E92BC]">Статус:</span>
                        <span className="text-white font-semibold">{userDetails.connectClient.status || '—'}</span>
                      </div>
                      {userDetails.connectClient.manager?.full_name && (
                        <div className="flex justify-between">
                          <span className="text-[#8E92BC]">Менеджер:</span>
                          <span className="text-white">{userDetails.connectClient.manager.full_name}</span>
                        </div>
                      )}
                      {userDetails.connectClient.total_spent !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-[#8E92BC]">Потрачено:</span>
                          <span className="text-[#22c55e] font-bold">{userDetails.connectClient.total_spent} руб.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Быстрые ответы */}
            <div className="bg-[#13141C] border border-white/[0.04] rounded-xl p-4 space-y-3">
              <h3 className="text-[11px] uppercase tracking-wider text-[#8E92BC] font-bold flex items-center gap-2">
                <Info size={14} /> Быстрые ответы
              </h3>
              
              <input 
                type="text"
                placeholder="Поиск шаблона..."
                value={templateSearch}
                onChange={e => setTemplateSearch(e.target.value)}
                className="w-full bg-[#1C1D2A] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11.5px] text-white placeholder-[#8E92BC]/50 outline-none focus:border-[#BFF128]/50"
              />

              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 hide-scrollbar">
                {filteredTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setText(tpl.text)}
                    className="w-full text-left p-2 rounded-lg bg-[#1C1D2A] hover:bg-white/[0.04] border border-white/[0.02] transition-colors text-[11.5px]"
                  >
                    <span className="font-bold text-[#BFF128] block mb-0.5">{tpl.title}</span>
                    <span className="text-white/60 line-clamp-2 leading-normal">{tpl.text}</span>
                  </button>
                ))}
                {filteredTemplates.length === 0 && (
                  <p className="text-[11.5px] text-[#8E92BC] text-center py-2">Шаблоны не найдены</p>
                )}
              </div>
            </div>

            {/* Referrals */}
            <div className="bg-[#13141C] border border-white/[0.04] rounded-xl p-4">
              <h3 className="text-[11px] uppercase tracking-wider text-[#8E92BC] font-bold mb-3 flex items-center gap-2">
                <Users size={14} /> Рефералы
              </h3>
              <div className="text-[24px] font-black text-white">{userDetails?.refCount || 0}</div>
              <p className="text-[11px] text-[#8E92BC] mt-1">Приглашенных друзей</p>
            </div>

            {/* Subscriptions */}
            <div>
              <h3 className="text-[11px] uppercase tracking-wider text-[#8E92BC] font-bold mb-3 flex items-center gap-2">
                <Shield size={14} /> Подписки
              </h3>
              
              {!userDetails ? (
                <Loader2 size={16} className="animate-spin text-[#8E92BC]" />
              ) : userDetails.subs?.length === 0 ? (
                <p className="text-[12px] text-[#8E92BC]">Нет активных подписок</p>
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
                            <div className="text-[12.5px] font-semibold text-white">Устройство {i + 1}</div>
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

                          <button
                            onClick={() => handleExtendSubscription(sub)}
                            disabled={sending}
                            className="w-full mt-3 py-1.5 rounded-lg bg-[#BFF128] text-black text-[11px] font-bold hover:bg-[#aade1f] transition-colors disabled:opacity-50"
                          >
                            {sending ? 'Продление...' : 'Продлить (+30 дней)'}
                          </button>
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
