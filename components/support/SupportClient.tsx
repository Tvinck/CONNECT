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

  // Support panel extension states
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderDetails, setOrderDetails] = useState<any | null>(null)
  const [procedures, setProcedures] = useState<any[]>([])
  const [proceduresLoading, setProceduresLoading] = useState(false)
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean[]>>({})
  const [dbTemplates, setDbTemplates] = useState<any[]>([])

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

  // Fetch GGSel order details, procedures, and templates
  useEffect(() => {
    if (!selectedUser) {
      setOrderDetails(null)
      setProcedures([])
      setCheckedSteps({})
      setDbTemplates([])
      return
    }

    setCheckedSteps({})
    const isGgsel = selectedUser.project?.toLowerCase().includes('ggsel')
    const p = isGgsel ? 'ggsel'
      : selectedUser.project?.toLowerCase().includes('veil') ? 'veil'
      : 'all'

    // Load order details
    if (isGgsel) {
      setOrderLoading(true)
      setOrderError('')
      fetch(`/api/shop/ggsel/order-details?userId=${encodeURIComponent(selectedUser.userId)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setOrderDetails(d.data)
          else setOrderError(d.error || 'Не удалось загрузить')
        })
        .catch(() => setOrderError('Ошибка сети'))
        .finally(() => setOrderLoading(false))
    } else {
      setOrderDetails(null)
    }

    // Load procedures
    setProceduresLoading(true)
    fetch(`/api/support/procedures?platform=${p}`)
      .then(r => r.json())
      .then(d => { if (d.success) setProcedures(d.data || []) })
      .catch(err => console.error(err))
      .finally(() => setProceduresLoading(false))

    // Load templates
    fetch(`/api/support/quick-replies?platform=${p}`)
      .then(r => r.json())
      .then(d => { if (d.success) setDbTemplates(d.data || []) })
      .catch(err => console.error(err))
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
    
    try {
      const response = await fetch('/api/shop/ggsel/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          message: text.trim(),
          project: selectedUser.project || 'Veil VPN',
          senderEmail: user?.email || 'unknown'
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка отправки');
      }
      
      setText('')
    } catch (err: any) {
      console.error(err);
      alert('Ошибка отправки: ' + err.message);
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

  const allTemplatesMap = new Map()
  dbTemplates.forEach(t => allTemplatesMap.set(t.title.toLowerCase(), { title: t.title, text: t.body }))
  QUICK_TEMPLATES.forEach(t => {
    if (!allTemplatesMap.has(t.title.toLowerCase())) {
      allTemplatesMap.set(t.title.toLowerCase(), t)
    }
  })
  const allTemplates = Array.from(allTemplatesMap.values())

  const filteredTemplates = allTemplates.filter(
    t => t.title.toLowerCase().includes(templateSearch.toLowerCase()) || 
         t.text.toLowerCase().includes(templateSearch.toLowerCase())
  )

  const displayName = selectedUser?.profile?.username || activeSub?.username || selectedUser?.profile?.telegram_username || activeSub?.telegram_username || 'Неизвестный'
  const tgName = selectedUser?.profile?.telegram_username || activeSub?.telegram_username

  return (
    <div className="flex h-[calc(100vh-80px)] gap-5 overflow-hidden w-full">
      {/* Left Column: Chats */}
      <div className="w-[320px] shrink-0 flex flex-col bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-white/[0.04] bg-white/[0.01]">
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
      <div className="w-[480px] shrink-0 bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-y-auto shadow-2xl p-6 space-y-7 relative">
        {!selectedUser ? (
          <div className="flex h-full items-center justify-center text-[#8E92BC] text-[14px] text-center px-4">
            Выберите чат для просмотра деталей клиента
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center pt-2">
              <Avatar 
                initials={getInitials(displayName)} 
                color={colorFor(displayName)} 
                size={96} 
                className="mx-auto mb-4 shadow-lg ring-4 ring-white/[0.02]"
              />
              <h2 className="text-[18px] font-bold text-white mb-1.5 tracking-tight">
                {displayName}
              </h2>
              {tgName && (
                <p className="text-[14px] text-[#BFF128] font-medium opacity-90">@{tgName}</p>
              )}
            </div>

            {/* GGSel Order Details Card */}
            {selectedUser?.project?.toLowerCase().includes('ggsel') && (
              <div className="bg-[#13141C] border border-white/[0.04] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[12px] uppercase tracking-wider text-[#8E92BC] font-bold flex items-center gap-2">
                    <Info size={15} /> Детали заказа GGSel
                  </h3>
                  {orderDetails?.orderUrl && (
                    <a 
                      href={orderDetails.orderUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-[#BFF128] hover:underline"
                    >
                      В панель GGSel ↗
                    </a>
                  )}
                </div>

                {orderLoading && (
                  <div className="flex items-center justify-center py-4 text-[#8E92BC] text-[12px] gap-2">
                    <Loader2 size={16} className="animate-spin" /> Загрузка данных заказа...
                  </div>
                )}

                {orderError && (
                  <div className="text-[12px] text-red-500 py-2 text-center bg-red-500/10 rounded-xl border border-red-500/20">
                    {orderError}
                  </div>
                )}

                {!orderLoading && !orderError && orderDetails && (
                  <div className="space-y-3 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#8E92BC]">Статус:</span>
                      <span 
                        className={clsx(
                          "font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide",
                          orderDetails.statusColor === 'green' && "bg-green-500/10 text-green-500",
                          orderDetails.statusColor === 'yellow' && "bg-yellow-500/10 text-yellow-500",
                          orderDetails.statusColor === 'red' && "bg-red-500/10 text-red-500",
                          orderDetails.statusColor === 'gray' && "bg-white/5 text-[#8E92BC]"
                        )}
                      >
                        {orderDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-[#8E92BC] shrink-0">Товар:</span>
                      <span className="text-white text-right font-medium max-w-[240px] truncate" title={orderDetails.productName}>
                        {orderDetails.productName}
                      </span>
                    </div>
                    {orderDetails.options && orderDetails.options.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
                        <span className="text-[#8E92BC] text-[11px] block">Параметры:</span>
                        <div className="text-[12px] text-white/80 bg-[#1C1D2A] p-2.5 rounded-lg border border-white/[0.02] space-y-1">
                          {orderDetails.options.map((o: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-[#8E92BC]">{o.name}:</span>
                              <span className="font-medium text-right text-white/90">{o.user_data}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#8E92BC]">Заказ ID:</span>
                      <span className="text-white font-mono">{orderDetails.orderId}</span>
                    </div>
                    {orderDetails.productId && (
                      <div className="flex justify-between">
                        <span className="text-[#8E92BC]">Товар ID:</span>
                        <span className="text-white font-mono">{orderDetails.productId}</span>
                      </div>
                    )}
                    {orderDetails.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-[#8E92BC]">Создан:</span>
                        <span className="text-white">
                          {new Date(orderDetails.createdAt).toLocaleString('ru-RU', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    {orderDetails.buyerEmail && (
                      <div className="flex justify-between">
                        <span className="text-[#8E92BC]">Покупатель:</span>
                        <span className="text-white font-mono">{orderDetails.buyerEmail}</span>
                      </div>
                    )}
                    {orderDetails.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-[#8E92BC]">Оплата:</span>
                        <span className="text-white">{orderDetails.paymentMethod}</span>
                      </div>
                    )}
                    {orderDetails.amount !== undefined && (
                      <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                        <span className="text-[#8E92BC]">Сумма:</span>
                        <span className="text-white font-semibold">
                          {orderDetails.amount} {orderDetails.currency}
                        </span>
                      </div>
                    )}
                    {orderDetails.profit !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-[#8E92BC]">Доход:</span>
                        <span className="text-[#BFF128] font-bold">
                          +{orderDetails.profit} {orderDetails.currency}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Registration & Connect Info */}
            <div className="bg-[#13141C] border border-white/[0.04] rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[12px] uppercase tracking-wider text-[#8E92BC] font-bold flex items-center gap-2 mb-1">
                <Info size={15} /> Учетная запись
              </h3>
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[#8E92BC] shrink-0">Email / Логин:</span>
                  <span className="text-white font-mono truncate max-w-[200px] text-right" title={userDetails?.email || 'не указан'}>
                    {userDetails?.email || 'не указан'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E92BC]">Veil VPN:</span>
                  <span className={clsx("font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide", activeSub ? "bg-green-500/10 text-green-500" : "bg-white/5 text-[#8E92BC]")}>
                    {activeSub ? 'Зарегистрирован' : 'Нет подписки'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E92BC]">Аккаунт Connect:</span>
                  <span className={clsx("font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide", userDetails?.connectUser ? "bg-[#BFF128]/10 text-[#BFF128]" : "bg-white/5 text-[#8E92BC]")}>
                    {userDetails?.connectUser ? 'Да' : 'Нет'}
                  </span>
                </div>
                {userDetails?.connectUser && (
                  <>
                    <div className="flex justify-between items-baseline gap-2 pt-2 border-t border-white/[0.04]">
                      <span className="text-[#8E92BC] shrink-0">ФИО:</span>
                      <span className="text-white text-right truncate max-w-[220px] font-medium">{userDetails.connectUser.full_name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E92BC]">Роль:</span>
                      <span className="text-[#BFF128] uppercase text-[11px] font-bold bg-[#BFF128]/10 px-2 py-0.5 rounded">
                        {userDetails.connectUser.role || 'user'}
                      </span>
                    </div>
                  </>
                )}
                {userDetails?.projects && userDetails.projects.length > 0 && (
                  <div className="pt-3 border-t border-white/[0.04]">
                    <span className="text-[#8E92BC] block mb-2">Доступ к проектам:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {userDetails.projects.map((p: any) => (
                        <span key={p.projects?.slug} className="text-[11px] font-medium bg-[#1C1D2A] border border-white/10 text-white px-2.5 py-1 rounded-md">
                          {p.projects?.name || p.projects?.slug}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {userDetails?.connectClient && (
                  <div className="pt-3 border-t border-white/[0.04]">
                    <span className="text-[#8E92BC] block mb-2">Профиль CRM-Клиента:</span>
                    <div className="space-y-2 text-[12px] bg-[#1C1D2A] p-3 rounded-xl border border-white/[0.02]">
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
                        <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                          <span className="text-[#8E92BC]">Потрачено:</span>
                          <span className="text-[#BFF128] font-bold text-[13px]">{userDetails.connectClient.total_spent} руб.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Procedures Checklist */}
            {procedures.length > 0 && (
              <div className="space-y-3.5">
                <h3 className="text-[12px] uppercase tracking-wider text-[#8E92BC] font-bold flex items-center gap-2 px-1">
                  <Check className="text-[#BFF128]" size={15} /> Чеклисты процедур
                </h3>
                {procedures.map((proc) => {
                  const checked = checkedSteps[proc.id] || new Array(proc.steps.length).fill(false)
                  const toggleStep = (idx: number) => {
                    const next = [...checked]
                    next[idx] = !next[idx]
                    setCheckedSteps(prev => ({
                      ...prev,
                      [proc.id]: next
                    }))
                  }

                  return (
                    <ProcedureItem 
                      key={proc.id} 
                      proc={proc} 
                      checked={checked} 
                      onToggle={toggleStep} 
                    />
                  )
                })}
              </div>
            )}

            {/* Быстрые ответы */}
            <div className="bg-[#13141C] border border-white/[0.04] rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[12px] uppercase tracking-wider text-[#8E92BC] font-bold flex items-center gap-2 mb-1">
                <Info size={15} /> Быстрые ответы
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E92BC]" size={14} />
                <input 
                  type="text"
                  placeholder="Поиск шаблона..."
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  className="w-full bg-[#1C1D2A] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-[13px] text-white placeholder-[#8E92BC]/50 outline-none focus:border-[#BFF128]/50 transition-colors"
                />
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-2 hide-scrollbar">
                {filteredTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setText(tpl.text)}
                    className="w-full text-left p-3 rounded-xl bg-[#1C1D2A] hover:bg-white/[0.04] border border-white/[0.02] transition-colors text-[12.5px] group"
                  >
                    <span className="font-bold text-[#BFF128] group-hover:text-[#d3f766] transition-colors block mb-1">{tpl.title}</span>
                    <span className="text-white/60 line-clamp-2 leading-relaxed">{tpl.text}</span>
                  </button>
                ))}
                {filteredTemplates.length === 0 && (
                  <p className="text-[13px] text-[#8E92BC] text-center py-4">Шаблоны не найдены</p>
                )}
              </div>
            </div>

            {/* Referrals */}
            <div className="bg-[#13141C] border border-white/[0.04] rounded-2xl p-5 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-[12px] uppercase tracking-wider text-[#8E92BC] font-bold flex items-center gap-2 mb-1">
                  <Users size={15} /> Рефералы
                </h3>
                <p className="text-[12px] text-[#8E92BC]">Приглашенных друзей</p>
              </div>
              <div className="text-[28px] font-black text-white bg-[#1C1D2A] px-4 py-2 rounded-xl border border-white/[0.02]">
                {userDetails?.refCount || 0}
              </div>
            </div>

            {/* Subscriptions */}
            <div className="bg-[#13141C] border border-white/[0.04] rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[12px] uppercase tracking-wider text-[#8E92BC] font-bold flex items-center gap-2 mb-1">
                <Shield size={15} /> Подписки
              </h3>
              
              {!userDetails ? (
                <Loader2 size={18} className="animate-spin text-[#8E92BC]" />
              ) : userDetails.subs?.length === 0 ? (
                <p className="text-[13px] text-[#8E92BC] text-center py-4">Нет активных подписок</p>
              ) : (
                <div className="space-y-3.5">
                  {userDetails.subs.map((sub: any, i: number) => {
                    const isActive = sub.status === 'active'
                    return (
                      <div key={sub.id} className="bg-[#1C1D2A] border border-white/[0.04] rounded-xl p-4 relative overflow-hidden transition-all hover:border-white/[0.08]">
                        <div className={clsx(
                          "absolute top-0 left-0 w-1.5 h-full", 
                          isActive ? "bg-[#BFF128]" : "bg-[#e63950]"
                        )} />
                        <div className="pl-3">
                          <div className="flex justify-between items-start mb-3">
                            <div className="text-[13.5px] font-semibold text-white">Устройство {i + 1}</div>
                            <span className={clsx("text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider", isActive ? "bg-[#BFF128]/10 text-[#BFF128]" : "bg-[#e63950]/10 text-[#e63950]")}>
                              {isActive ? 'Active' : 'Expired'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-[12.5px] text-[#8E92BC]">
                            <div className="flex justify-between">
                              <span>Трафик:</span>
                              <span className="text-white font-medium">{sub.traffic_limit ? Math.round(sub.traffic_limit / 1073741824) + ' ГБ' : 'Безлимит'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Истекает:</span>
                              <span className="text-white font-medium">{sub.expires_at ? format(new Date(sub.expires_at), 'dd.MM.yyyy') : 'Бессрочно'}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleExtendSubscription(sub)}
                            disabled={sending}
                            className="w-full mt-4 py-2.5 rounded-lg bg-[#BFF128] text-black text-[12px] font-bold tracking-wide hover:bg-[#d3f766] transition-colors disabled:opacity-50 hover:shadow-lg hover:shadow-[#BFF128]/20"
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

function ProcedureItem({ proc, checked, onToggle }: { proc: any; checked: boolean[]; onToggle: (idx: number) => void }) {
  const [open, setOpen] = useState(false)
  const doneCount = checked?.filter(Boolean).length || 0
  const isAllDone = doneCount === proc.steps.length

  return (
    <div className="bg-[#13141C] border border-white/[0.04] rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-transparent border-none text-left focus:outline-none hover:bg-white/[0.01] transition-colors"
      >
        <div className="space-y-1">
          <span className="text-[13px] font-bold text-white block">{proc.title}</span>
          <span className="text-[11px] text-[#8E92BC]">
            {doneCount} из {proc.steps.length} выполнено
          </span>
        </div>
        <div className="flex items-center gap-3">
          {doneCount > 0 && (
            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#BFF128] transition-all duration-300" 
                style={{ width: `${(doneCount / proc.steps.length) * 100}%` }}
              />
            </div>
          )}
          <span className={clsx("text-white/40 transition-transform duration-200 text-[10px]", open && "rotate-180")}>
            ▼
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.04] p-4 space-y-2.5 bg-[#1C1D2A]/40">
          {proc.steps.map((step: any, idx: number) => {
            const isChecked = checked?.[idx] || false
            return (
              <label 
                key={idx} 
                className="flex items-start gap-3 cursor-pointer text-[12.5px] select-none py-1 group"
              >
                <input 
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(idx)}
                  className="mt-0.5 rounded border-white/10 bg-[#1C1D2A] text-[#BFF128] focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                />
                <span className={clsx("transition-colors leading-relaxed", isChecked ? "text-[#8E92BC] line-through" : "text-white/80 group-hover:text-white")}>
                  {step.text}
                  {step.note && (
                    <span className="block text-[11px] text-[#8E92BC]/60 mt-0.5 no-underline">{step.note}</span>
                  )}
                </span>
              </label>
            )
          })}
          {isAllDone && proc.steps.length > 0 && (
            <div className="text-center text-[12px] text-[#BFF128] font-semibold pt-2 border-t border-white/[0.02]">
              ✓ Процедура завершена
            </div>
          )}
        </div>
      )}
    </div>
  )
}
