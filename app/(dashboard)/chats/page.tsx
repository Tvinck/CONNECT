/**
 * app/(dashboard)/chats/page.tsx — Real-time team chat.
 *
 * Features:
 *  - Public channels + DM channels (slug: dm:{id_a}:{id_b})
 *  - Messages with reply threads and persistent emoji reactions (saved to DB)
 *  - Supabase Realtime subscriptions for messages and reactions
 *  - "Load more" button for channel history (cursor-based, oldest-first)
 *  - Connection error banner when the WebSocket drops
 *  - Members panel with quick-DM button
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Hash, Send, Plus, Smile, Reply, X, Loader2, MessageSquare, Search, WifiOff, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { getInitials, colorFor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { UserProfileModal } from '@/components/profile/UserProfileModal'

const EMOJI_QUICK = ['😀','😂','🔥','❤️','👍','👋','🎉','✅','💪','🤝','😊','🙏','💡','⚡','🚀','😅','🤔','👏','🫡','💯','😎','🌟','🔧','📦','💬','🗓️','✨','🎯','🤩','👀']

/** Shape of a message row with joined sender. */
type DbMsg = {
  id: string
  content: string
  channel_id: string
  created_at: string
  reply_to: string | null
  sender: { id: string; full_name: string } | null
}

type ChannelRow = { id: string; name: string; description: string | null; slug?: string }
type MemberRow  = { id: string; full_name: string; role: string; status: string }

/** Fields fetched for every message. */
const MSG_SELECT = 'id, content, channel_id, created_at, reply_to, sender:users!sender_id(id, full_name)'
/** Number of messages to load per batch. */
const MSG_PAGE = 60

// ---------------------------------------------------------------------------
// CreateChannelModal
// ---------------------------------------------------------------------------

function CreateChannelModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: ChannelRow) => void }) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || `channel-${Date.now()}`

  const create = async () => {
    if (!name.trim()) { setError('Укажите название канала'); return }
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('channels').insert({ name: name.trim(), slug: slugify(name), description: description.trim() || null })
      .select('id, name, description, slug').single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onCreated(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card text-[#171821] border border-line rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-modal-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">Новый канал</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-mute hover:text-[#171821] hover:bg-bg transition-all inline-flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute font-semibold mb-2">Название *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="маркетинг"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F4F5FA]/50 border border-line focus:border-accent focus:bg-card outline-none text-[13.5px] text-[#171821] placeholder:text-mute transition-all" />
          </div>
          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute font-semibold mb-2">Описание</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="О чём канал"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F4F5FA]/50 border border-line focus:border-accent focus:bg-card outline-none text-[13.5px] text-[#171821] placeholder:text-mute transition-all" />
          </div>
          {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={create} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : null} Создать
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NewDmModal
// ---------------------------------------------------------------------------

function NewDmModal({ members, currentUserId, onClose, onSelect }: {
  members: MemberRow[]
  currentUserId: string
  onClose: () => void
  onSelect: (member: MemberRow) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = members.filter(m =>
    m.id !== currentUserId &&
    m.full_name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card text-[#171821] border border-line rounded-2xl w-full max-w-[380px] shadow-2xl overflow-hidden animate-modal-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">Новое сообщение</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-mute hover:text-[#171821] hover:bg-bg transition-all inline-flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[#F4F5FA]/50 border border-line">
            <Search size={14} className="text-mute shrink-0" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск сотрудника…" autoFocus
              className="flex-1 bg-transparent outline-none text-[13px] text-[#171821] placeholder:text-mute" />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="text-center py-6 text-mute text-[13px]">Никого не найдено</div>
          )}
          {filtered.map(m => (
            <button key={m.id} onClick={() => { onSelect(m); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg transition-all text-left">
              <div className="relative shrink-0">
                <Avatar initials={getInitials(m.full_name)} color={colorFor(m.full_name)} size={36} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card"
                  style={{ background: m.status === 'online' ? '#22C55E' : m.status === 'busy' ? '#F59E0B' : '#5A6188' }} />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold">{m.full_name}</div>
                <div className="text-[11px] text-mute capitalize">{m.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChatsPage
// ---------------------------------------------------------------------------

export default function ChatsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()

  const [channels,          setChannels]          = useState<ChannelRow[]>([])
  const [dmChannels,        setDmChannels]        = useState<(ChannelRow & { otherUser: MemberRow })[]>([])
  const [activeChannelId,   setActiveChannelId]   = useState('')
  const [messages,          setMessages]          = useState<DbMsg[]>([])
  const [text,              setText]              = useState('')
  const [showEmoji,         setShowEmoji]         = useState(false)
  const [members,           setMembers]           = useState<MemberRow[]>([])
  const [loading,           setLoading]           = useState(true)
  const [loadingMore,       setLoadingMore]       = useState(false)
  const [hasMore,           setHasMore]           = useState(false)
  const [realtimeError,     setRealtimeError]     = useState(false)
  /** reactions[messageId][emoji] = [userId, …] */
  const [reactions,         setReactions]         = useState<Record<string, Record<string, string[]>>>({})
  const [replyTo,           setReplyTo]           = useState<DbMsg | null>(null)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showNewDm,         setShowNewDm]         = useState(false)
  const [viewUserId,        setViewUserId]        = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const emojiRef  = useRef<HTMLDivElement>(null)

  // Close emoji picker on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    if (showEmoji) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  // Load channels + members on mount.
  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('channels').select('id, name, description, slug').order('name'),
      supabase.from('users').select('id, full_name, role, status').eq('is_active', true),
    ]).then(([{ data: ch }, { data: mb }]) => {
      const allChannels = (ch ?? []) as (ChannelRow & { slug?: string })[]
      const memberList  = (mb ?? []) as MemberRow[]
      setMembers(memberList)

      const publicChs = allChannels.filter(c => !c.slug?.startsWith('dm:'))
      const dmChs = allChannels
        .filter(c => c.slug?.startsWith('dm:'))
        .map(c => {
          const parts  = c.slug!.replace('dm:', '').split(':')
          const otherId = parts.find(id => id !== user.id) ?? parts[0]
          const otherUser = memberList.find(m => m.id === otherId) ?? {
            id: otherId, full_name: 'Пользователь', role: '', status: 'offline',
          }
          return { ...c, otherUser }
        })

      setChannels(publicChs)
      setDmChannels(dmChs)
      if (publicChs[0]) setActiveChannelId(publicChs[0].id)
    })
  }, [user, supabase])

  // ---------------------------------------------------------------------------
  // Reactions helpers
  // ---------------------------------------------------------------------------

  /** Builds the reactions map from a flat DB rows array. */
  const buildReactionsMap = (rows: { message_id: string; user_id: string; emoji: string }[]) => {
    const map: Record<string, Record<string, string[]>> = {}
    for (const r of rows) {
      if (!map[r.message_id]) map[r.message_id] = {}
      if (!map[r.message_id][r.emoji]) map[r.message_id][r.emoji] = []
      map[r.message_id][r.emoji].push(r.user_id)
    }
    return map
  }

  /** Fetches all reactions for a given list of message IDs. */
  const loadReactions = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length) return
    const { data } = await supabase
      .from('message_reactions')
      .select('message_id, user_id, emoji')
      .in('message_id', messageIds)
    if (data) setReactions(buildReactionsMap(data))
  }, [supabase])

  // ---------------------------------------------------------------------------
  // Message loading
  // ---------------------------------------------------------------------------

  const loadMessages = useCallback(async () => {
    if (!activeChannelId) return
    setLoading(true)
    const { data } = await supabase
      .from('messages').select(MSG_SELECT)
      .eq('channel_id', activeChannelId)
      .order('created_at', { ascending: false })
      .limit(MSG_PAGE)
    const msgs = ((data ?? []) as unknown as DbMsg[]).reverse()
    setMessages(msgs)
    setHasMore((data ?? []).length === MSG_PAGE)
    setLoading(false)
    if (msgs.length) await loadReactions(msgs.map(m => m.id))
  }, [activeChannelId, loadReactions, supabase])

  useEffect(() => { loadMessages() }, [loadMessages])

  /** Loads older messages above the current oldest (cursor-based). */
  const loadOlderMessages = async () => {
    const oldest = messages[0]
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    const { data } = await supabase
      .from('messages').select(MSG_SELECT)
      .eq('channel_id', activeChannelId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(MSG_PAGE)
    const older = ((data ?? []) as unknown as DbMsg[]).reverse()
    setMessages(prev => [...older, ...prev])
    setHasMore(older.length === MSG_PAGE)
    setLoadingMore(false)
    if (older.length) {
      const { data: rxData } = await supabase
        .from('message_reactions').select('message_id, user_id, emoji')
        .in('message_id', older.map(m => m.id))
      if (rxData) setReactions(prev => ({ ...prev, ...buildReactionsMap(rxData) }))
    }
  }

  // ---------------------------------------------------------------------------
  // Realtime subscriptions
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!activeChannelId) return

    const sub = supabase
      .channel(`chat-${activeChannelId}`)
      // New messages
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `channel_id=eq.${activeChannelId}`,
      }, async ({ new: row }) => {
        const { data } = await supabase.from('messages').select(MSG_SELECT).eq('id', row.id).single()
        if (data) setMessages(prev =>
          prev.some(m => m.id === (data as unknown as DbMsg).id) ? prev : [...prev, data as unknown as DbMsg]
        )
      })
      // Reaction added
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'message_reactions',
      }, ({ new: r }) => {
        setReactions(prev => {
          const msg   = { ...(prev[r.message_id] ?? {}) }
          const list  = msg[r.emoji] ?? []
          if (list.includes(r.user_id)) return prev
          msg[r.emoji] = [...list, r.user_id]
          return { ...prev, [r.message_id]: msg }
        })
      })
      // Reaction removed
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'message_reactions',
      }, ({ old: r }) => {
        setReactions(prev => {
          const msg  = { ...(prev[r.message_id] ?? {}) }
          const list = (msg[r.emoji] ?? []).filter((id: string) => id !== r.user_id)
          if (list.length === 0) { delete msg[r.emoji] } else { msg[r.emoji] = list }
          return { ...prev, [r.message_id]: msg }
        })
      })
      .subscribe((status) => {
        setRealtimeError(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
      })

    return () => { supabase.removeChannel(sub) }
  }, [activeChannelId, supabase])

  // Auto-scroll to the bottom when new messages arrive.
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const send = async () => {
    const content = text.trim()
    if (!content || !user) return
    const replyId = replyTo?.id ?? null
    setText(''); setReplyTo(null)
    inputRef.current?.focus()
    const { data } = await supabase
      .from('messages')
      .insert({ channel_id: activeChannelId, sender_id: user.id, content, reply_to: replyId })
      .select(MSG_SELECT).single()
    if (data) setMessages(prev =>
      prev.some(m => m.id === (data as unknown as DbMsg).id) ? prev : [...prev, data as unknown as DbMsg]
    )
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  /** Toggles an emoji reaction — persists the change to the DB. */
  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!user) return
    const already = reactions[msgId]?.[emoji]?.includes(user.id) ?? false

    // Optimistic update
    setReactions(prev => {
      const msg  = { ...(prev[msgId] ?? {}) }
      const list = msg[emoji] ?? []
      msg[emoji] = already ? list.filter(id => id !== user.id) : [...list, user.id]
      if (msg[emoji].length === 0) delete msg[emoji]
      return { ...prev, [msgId]: msg }
    })

    // Persist to DB (fire-and-forget; Realtime will echo the change back anyway)
    if (already) {
      await supabase.from('message_reactions')
        .delete().eq('message_id', msgId).eq('user_id', user.id).eq('emoji', emoji)
    } else {
      await supabase.from('message_reactions')
        .insert({ message_id: msgId, user_id: user.id, emoji })
    }
  }

  const openDmWith = async (member: MemberRow) => {
    if (!user) return
    const [a, b] = [user.id, member.id].sort()
    const slug   = `dm:${a}:${b}`

    const { data: existing } = await supabase
      .from('channels').select('id, name, description, slug').eq('slug', slug).single()
    if (existing) {
      const dm = { ...existing, otherUser: member }
      setDmChannels(prev => prev.some(d => d.id === existing.id) ? prev : [...prev, dm])
      setActiveChannelId(existing.id)
      return
    }

    const { data: created } = await supabase
      .from('channels')
      .insert({ name: `ЛС: ${member.full_name}`, slug, description: null, is_private: true })
      .select('id, name, description, slug').single()
    if (created) {
      setDmChannels(prev => [...prev, { ...created, otherUser: member }])
      setActiveChannelId(created.id)
    }
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const allChannelsList = [...channels, ...dmChannels]
  const activeCh  = allChannelsList.find(c => c.id === activeChannelId)
  const activeDm  = dmChannels.find(c => c.id === activeChannelId)
  const parentOf  = (id: string | null) => id ? messages.find(m => m.id === id) ?? null : null

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex bg-card" style={{ height: '100vh' }}>

      {/* ── Channels sidebar ── */}
      <div className="w-[220px] shrink-0 border-r border-line flex flex-col bg-card">
        <div className="px-4 py-4 border-b border-line">
          <h3 className="text-[13px] font-bold tracking-tight text-[#171821]">Чаты</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-mute px-2 mb-1.5 font-semibold mt-2">Каналы</div>
          {channels.map(c => (
            <button key={c.id} onClick={() => setActiveChannelId(c.id)}
              className={`w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[13px] font-medium tracking-tight mb-0.5 transition-all ${
                c.id === activeChannelId
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-mute hover:text-[#171821] hover:bg-bg'
              }`}>
              <Hash size={14} className="shrink-0" />
              <span className="flex-1 text-left truncate">{c.name}</span>
            </button>
          ))}
          <button onClick={() => setShowCreateChannel(true)}
            className="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[12px] text-mute hover:text-[#171821] hover:bg-bg mt-0.5 transition-all">
            <Plus size={14} /> Создать канал
          </button>

          <div className="text-[10px] uppercase tracking-[0.14em] text-mute px-2 mb-1.5 font-semibold mt-4">Личные</div>
          {dmChannels.map(d => (
            <button key={d.id} onClick={() => setActiveChannelId(d.id)}
              className={`w-full flex items-center gap-2 px-2 h-10 rounded-lg text-[13px] font-medium tracking-tight mb-0.5 transition-all ${
                d.id === activeChannelId
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-mute hover:text-[#171821] hover:bg-bg'
              }`}>
              <div className="relative shrink-0">
                <Avatar initials={getInitials(d.otherUser.full_name)} color={colorFor(d.otherUser.full_name)} size={24} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-card"
                  style={{ background: d.otherUser.status === 'online' ? '#22C55E' : d.otherUser.status === 'busy' ? '#F59E0B' : '#5A6188' }} />
              </div>
              <span className="flex-1 text-left truncate">{d.otherUser.full_name.split(' ')[0]}</span>
            </button>
          ))}
          <button onClick={() => setShowNewDm(true)}
            className="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[12px] text-mute hover:text-[#171821] hover:bg-bg mt-0.5 transition-all">
            <Plus size={14} /> Новое сообщение
          </button>
        </div>
      </div>

      {/* ── Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-card text-[#171821]">

        {/* Connection error banner */}
        {realtimeError && (
          <div className="flex items-center gap-2 px-4 py-2 bg-err/10 border-b border-err/20 text-err text-[12px] shrink-0">
            <WifiOff size={13} /> Соединение потеряно — сообщения могут не обновляться в реальном времени
          </div>
        )}

        {/* Channel header */}
        <div className="px-5 py-3.5 border-b border-line flex items-center gap-3 shrink-0">
          {activeDm ? (
            <>
              <div className="relative shrink-0">
                <Avatar initials={getInitials(activeDm.otherUser.full_name)} color={colorFor(activeDm.otherUser.full_name)} size={30} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card"
                  style={{ background: activeDm.otherUser.status === 'online' ? '#22C55E' : activeDm.otherUser.status === 'busy' ? '#F59E0B' : '#5A6188' }} />
              </div>
              <div>
                <span className="text-[14px] font-semibold tracking-tight">{activeDm.otherUser.full_name}</span>
                <span className="text-[12px] text-mute ml-2">
                  {activeDm.otherUser.status === 'online' ? 'Онлайн' : activeDm.otherUser.status === 'busy' ? 'На встрече' : 'Офлайн'}
                </span>
              </div>
            </>
          ) : (
            <>
              <Hash size={16} className="text-mute shrink-0" />
              <span className="text-[14px] font-semibold tracking-tight">{activeCh?.name ?? ''}</span>
              {(activeCh as ChannelRow)?.description && (
                <span className="text-[12px] text-mute ml-1 hidden sm:block">· {(activeCh as ChannelRow).description}</span>
              )}
            </>
          )}
          <div className="ml-auto flex items-center gap-1 text-[12px] text-mute">
            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-dot" />
            <span>{members.filter(m => m.status === 'online').length} онлайн</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F4F5FA]/50">

          {/* Load more history */}
          {hasMore && !loading && (
            <div className="flex justify-center mb-4">
              <button
                onClick={loadOlderMessages}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-4 h-8 rounded-xl border border-line bg-card hover:bg-bg text-[12px] text-mute hover:text-[#171821] transition-all disabled:opacity-50"
              >
                {loadingMore ? <Loader2 size={13} className="animate-spin" /> : <ChevronUp size={13} />}
                {loadingMore ? 'Загрузка…' : 'Загрузить ещё'}
              </button>
            </div>
          )}

          {loading && <div className="text-center py-8 text-mute text-[13px]">Загрузка…</div>}

          {!loading && messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={32} className="text-mute mx-auto mb-3" />
              <div className="text-mute text-[13px]">
                {activeDm
                  ? `Начните переписку с ${activeDm.otherUser.full_name.split(' ')[0]}`
                  : 'Сообщений ещё нет. Напишите первым!'}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map(m => {
              const name  = m.sender?.full_name ?? 'Пользователь'
              const isMe  = user?.id === m.sender?.id
              const msgRx = reactions[m.id] ?? {}
              const parent = parentOf(m.reply_to)

              return (
                <div key={m.id} className={`flex items-start gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <button onClick={() => m.sender && setViewUserId(m.sender.id)}
                      className="shrink-0 mt-0.5 hover:opacity-80 transition-opacity">
                      <Avatar initials={getInitials(name)} color={colorFor(name)} size={34} />
                    </button>
                  )}

                  <div className={`min-w-0 flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <div className="flex items-baseline gap-2.5 mb-1">
                        <button onClick={() => m.sender && setViewUserId(m.sender.id)}
                          className="text-[13.5px] font-semibold hover:text-accent transition-colors">{name}</button>
                        <span className="text-[11px] text-mute font-mono">{fmtTime(m.created_at)}</span>
                      </div>
                    )}

                    {parent && (
                      <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-accent/50 bg-card text-[12px] max-w-full ${isMe ? 'text-right' : ''}`}>
                        <div className="text-accent font-medium truncate">{parent.sender?.full_name ?? 'Пользователь'}</div>
                        <div className="text-mute truncate">{parent.content}</div>
                      </div>
                    )}

                    <div className={`text-[13.5px] leading-relaxed px-3.5 py-2.5 rounded-2xl shadow-sm ${
                      isMe ? 'bg-accent text-white rounded-tr-sm' : 'bg-card border border-line text-[#171821] rounded-tl-sm'
                    }`}>
                      {m.content}
                    </div>

                    {/* Persistent reactions */}
                    {Object.keys(msgRx).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(msgRx).map(([emoji, uids]) => (
                          <button key={emoji} onClick={() => toggleReaction(m.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border transition-all ${
                              uids.includes(user?.id ?? '')
                                ? 'bg-accent/10 border-accent/30 text-accent'
                                : 'bg-card border-line hover:border-line2 text-mute hover:text-[#171821]'
                            }`}
                          >
                            {emoji}<span className="font-mono text-[11px]">{uids.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Hover actions: reply + quick emoji */}
                    <div className={`flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'flex-row-reverse' : ''}`}>
                      <button onClick={() => setReplyTo(m)}
                        className="flex items-center gap-1 px-2 h-6 text-[11px] text-mute hover:text-[#171821] rounded-lg hover:bg-bg transition-all">
                        <Reply size={12} /> Ответить
                      </button>
                      <span className="w-px h-3 bg-line" />
                      {['👍','🔥','❤️','😂','🎉'].map(e => (
                        <button key={e} onClick={() => toggleReaction(m.id, e)}
                          className="w-6 h-6 text-sm hover:scale-125 transition-transform rounded-lg hover:bg-bg flex items-center justify-center">
                          {e}
                        </button>
                      ))}
                    </div>

                    {isMe && <span className="text-[11px] text-mute font-mono mt-0.5">{fmtTime(m.created_at)}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-5 py-4 border-t border-line shrink-0 relative bg-card">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-[#F4F5FA]/50 border-l-2 border-accent">
              <Reply size={13} className="text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] text-accent font-medium">Ответ · {replyTo.sender?.full_name ?? 'Пользователь'}</div>
                <div className="text-[12px] text-mute truncate">{replyTo.content}</div>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-mute hover:text-[#171821] shrink-0"><X size={14} /></button>
            </div>
          )}

          {showEmoji && (
            <div ref={emojiRef} className="absolute bottom-full left-5 mb-2 bg-card border border-line rounded-2xl p-3 shadow-2xl z-50 w-72 text-[#171821]">
              <div className="grid grid-cols-10 gap-0.5">
                {EMOJI_QUICK.map(e => (
                  <button key={e}
                    onClick={() => { setText(t => t + e); setShowEmoji(false); inputRef.current?.focus() }}
                    className="w-7 h-7 text-lg hover:bg-bg rounded-lg flex items-center justify-center transition-all">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#F4F5FA]/50 border border-line hover:border-line2 focus-within:border-accent/50 transition-all text-[#171821]">
            <button onClick={() => setShowEmoji(v => !v)}
              className={`transition-colors shrink-0 ${showEmoji ? 'text-accent' : 'text-mute hover:text-[#171821]'}`}>
              <Smile size={18} />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={activeDm
                ? `Написать ${activeDm.otherUser.full_name.split(' ')[0]}…`
                : `Написать в #${activeCh?.name ?? ''}…`}
              className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-mute"
            />
            <button onClick={send} disabled={!text.trim()}
              className="w-8 h-8 rounded-lg bg-accent/15 text-accent hover:bg-accent hover:text-white transition-all inline-flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Members panel ── */}
      <div className="w-[200px] shrink-0 border-l border-line hidden xl:flex flex-col bg-card">
        <div className="px-4 py-4 border-b border-line shrink-0">
          <span className="text-[11px] text-mute uppercase tracking-[0.12em] font-semibold">
            Участники · {members.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {members.map(m => (
            <button key={m.id} onClick={() => setViewUserId(m.id)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-bg transition-all text-left group">
              <div className="relative shrink-0">
                <Avatar initials={getInitials(m.full_name)} color={colorFor(m.full_name)} size={28} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card"
                  style={{ background: m.status === 'online' ? '#22C55E' : m.status === 'busy' ? '#F59E0B' : '#5A6188' }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium truncate text-[#171821]">{m.full_name.split(' ')[0]}</div>
                <div className="text-[10.5px] text-mute truncate capitalize">{m.role}</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); if (m.id !== user?.id) openDmWith(m) }}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md text-mute hover:text-accent hover:bg-accent/10 inline-flex items-center justify-center transition-all shrink-0"
              >
                <MessageSquare size={11} />
              </button>
            </button>
          ))}
        </div>
      </div>

      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreated={c => { setChannels(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name))); setActiveChannelId(c.id) }}
        />
      )}
      {showNewDm && (
        <NewDmModal
          members={members}
          currentUserId={user?.id ?? ''}
          onClose={() => setShowNewDm(false)}
          onSelect={openDmWith}
        />
      )}
      {viewUserId && <UserProfileModal userId={viewUserId} onClose={() => setViewUserId(null)} />}
    </div>
  )
}
