'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Hash, Send, Plus, Smile, Reply, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { getInitials, colorFor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { UserProfileModal } from '@/components/profile/UserProfileModal'

const EMOJI_QUICK = ['😀','😂','🔥','❤️','👍','👋','🎉','✅','💪','🤝','😊','🙏','💡','⚡','🚀','😅','🤔','👏','🫡','💯','😎','🌟','🔧','📦','💬','🗓️','✨','🎯','🤩','👀']

type DbMsg = {
  id: string
  content: string
  channel_id: string
  created_at: string
  reply_to: string | null
  sender: { id: string; full_name: string } | null
}

type ChannelRow = { id: string; name: string; description: string | null }
type MemberRow  = { id: string; full_name: string; role: string; status: string }

const MSG_SELECT = 'id, content, channel_id, created_at, reply_to, sender:users!sender_id(id, full_name)'

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
    setSaving(true)
    setError('')
    const { data, error: dbErr } = await supabase
      .from('channels')
      .insert({ name: name.trim(), slug: slugify(name), description: description.trim() || null })
      .select('id, name, description')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onCreated(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#151829] border border-line rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-[16px] font-bold tracking-tight">Новый канал</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-mute hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Название *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="маркетинг"
              className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all" />
          </div>
          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Описание</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="О чём канал"
              className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all" />
          </div>
          {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={create} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            Создать
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ChatsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()

  const [channels, setChannels] = useState<ChannelRow[]>([])
  const [activeChannelId, setActiveChannelId] = useState('')
  const [messages, setMessages] = useState<DbMsg[]>([])
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({})
  const [replyTo, setReplyTo] = useState<DbMsg | null>(null)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [viewUserId, setViewUserId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const emojiRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    if (showEmoji) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  useEffect(() => {
    Promise.all([
      supabase.from('channels').select('id, name, description').order('name'),
      supabase.from('users').select('id, full_name, role, status').eq('is_active', true),
    ]).then(([{ data: ch }, { data: mb }]) => {
      const chList = ch ?? []
      setChannels(chList)
      if (chList.length > 0) setActiveChannelId(chList[0].id)
      setMembers(mb ?? [])
    })
  }, [])

  const loadMessages = useCallback(async () => {
    if (!activeChannelId) return
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select(MSG_SELECT)
      .eq('channel_id', activeChannelId)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages((data ?? []) as unknown as DbMsg[])
    setLoading(false)
  }, [activeChannelId])

  useEffect(() => { loadMessages() }, [loadMessages])

  useEffect(() => {
    if (!activeChannelId) return
    const sub = supabase
      .channel(`chat-${activeChannelId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `channel_id=eq.${activeChannelId}`,
      }, async ({ new: row }) => {
        // Skip if we already have it (our own insert returned it directly).
        const { data } = await supabase.from('messages').select(MSG_SELECT).eq('id', row.id).single()
        if (data) setMessages(prev => prev.some(m => m.id === (data as any).id) ? prev : [...prev, data as unknown as DbMsg])
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [activeChannelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const content = text.trim()
    if (!content || !user) return
    const replyId = replyTo?.id ?? null
    setText('')
    setReplyTo(null)
    inputRef.current?.focus()
    const { data } = await supabase
      .from('messages')
      .insert({ channel_id: activeChannelId, sender_id: user.id, content, reply_to: replyId })
      .select(MSG_SELECT)
      .single()
    if (data) setMessages(prev => prev.some(m => m.id === (data as any).id) ? prev : [...prev, data as unknown as DbMsg])
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const startReply = (m: DbMsg) => {
    setReplyTo(m)
    inputRef.current?.focus()
  }

  const toggleReaction = (msgId: string, emoji: string) => {
    if (!user) return
    setReactions(prev => {
      const msg  = { ...(prev[msgId] ?? {}) }
      const list = msg[emoji] ?? []
      msg[emoji] = list.includes(user.id) ? list.filter(id => id !== user.id) : [...list, user.id]
      if (msg[emoji].length === 0) delete msg[emoji]
      return { ...prev, [msgId]: msg }
    })
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const activeCh = channels.find(c => c.id === activeChannelId)
  const parentOf = (id: string | null) => id ? messages.find(m => m.id === id) ?? null : null

  return (
    <div className="flex" style={{ height: '100vh' }}>
      {/* ── Channels sidebar ── */}
      <div className="w-[220px] shrink-0 border-r border-line flex flex-col">
        <div className="px-4 py-4 border-b border-line">
          <h3 className="text-[13px] font-bold tracking-tight">Чаты</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-mute2 px-2 mb-1.5 font-semibold mt-2">
            Каналы
          </div>
          {channels.map(c => (
            <button key={c.id} onClick={() => setActiveChannelId(c.id)}
              className={`w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[13px] font-medium tracking-tight mb-0.5 transition-all ${
                c.id === activeChannelId
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-mute hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Hash size={14} className="shrink-0" />
              <span className="flex-1 text-left truncate">{c.name}</span>
            </button>
          ))}
          <button onClick={() => setShowCreateChannel(true)}
            className="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[12px] text-mute hover:text-white hover:bg-white/[0.04] mt-1 transition-all">
            <Plus size={14} /> Создать канал
          </button>
        </div>
      </div>

      {/* ── Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Channel header */}
        <div className="px-5 py-3.5 border-b border-line flex items-center gap-3 shrink-0">
          <Hash size={16} className="text-mute shrink-0" />
          <span className="text-[14px] font-semibold tracking-tight">{activeCh?.name ?? ''}</span>
          {activeCh?.description && (
            <span className="text-[12px] text-mute ml-1 hidden sm:block">· {activeCh.description}</span>
          )}
          <div className="ml-auto flex items-center gap-1 text-[12px] text-mute2">
            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-dot" />
            <span>{members.filter(m => m.status === 'online').length} онлайн</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <div className="text-center py-8 text-mute text-[13px]">Загрузка…</div>}
          {!loading && messages.length === 0 && (
            <div className="text-center py-12 text-mute text-[13px]">Сообщений ещё нет. Напишите первым!</div>
          )}
          <div className="space-y-4">
            {messages.map(m => {
              const name   = m.sender?.full_name ?? 'Пользователь'
              const isMe   = user?.id === m.sender?.id
              const msgRx  = reactions[m.id] ?? {}
              const parent = parentOf(m.reply_to)
              return (
                <div key={m.id} className={`flex items-start gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <button onClick={() => m.sender && setViewUserId(m.sender.id)} className="shrink-0 mt-0.5 hover:opacity-80 transition-opacity">
                      <Avatar initials={getInitials(name)} color={colorFor(name)} size={34} />
                    </button>
                  )}
                  <div className={`min-w-0 flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <div className="flex items-baseline gap-2.5 mb-1">
                        <button onClick={() => m.sender && setViewUserId(m.sender.id)}
                          className="text-[13.5px] font-semibold hover:text-accent transition-colors">{name}</button>
                        <span className="text-[11px] text-mute2 font-mono">{fmtTime(m.created_at)}</span>
                      </div>
                    )}

                    {/* Quoted parent */}
                    {parent && (
                      <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-accent/50 bg-white/[0.03] text-[12px] max-w-full ${isMe ? 'text-right' : ''}`}>
                        <div className="text-accent font-medium truncate">{parent.sender?.full_name ?? 'Пользователь'}</div>
                        <div className="text-mute truncate">{parent.content}</div>
                      </div>
                    )}

                    <div className={`text-[13.5px] leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                      isMe ? 'bg-accent/25 text-white/90 rounded-tr-sm' : 'bg-white/[0.05] text-white/85 rounded-tl-sm'
                    }`}>
                      {m.content}
                    </div>

                    {/* Reactions display */}
                    {Object.keys(msgRx).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(msgRx).map(([emoji, users]) => (
                          <button key={emoji} onClick={() => toggleReaction(m.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border transition-all ${
                              users.includes(user?.id ?? '')
                                ? 'bg-accent/20 border-accent/40 text-accent'
                                : 'bg-white/[0.04] border-line hover:border-line2 text-white/70'
                            }`}
                          >
                            {emoji}<span className="font-mono text-[11px]">{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Hover actions: reply + quick reactions */}
                    <div className={`flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'flex-row-reverse' : ''}`}>
                      <button onClick={() => startReply(m)}
                        className="flex items-center gap-1 px-2 h-6 text-[11px] text-mute hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                        <Reply size={12} /> Ответить
                      </button>
                      <span className="w-px h-3 bg-line" />
                      {['👍','🔥','❤️','😂','🎉'].map(e => (
                        <button key={e} onClick={() => toggleReaction(m.id, e)}
                          className="w-6 h-6 text-sm hover:scale-125 transition-transform rounded-lg hover:bg-white/[0.06] flex items-center justify-center">
                          {e}
                        </button>
                      ))}
                    </div>

                    {isMe && <span className="text-[11px] text-mute2 font-mono mt-0.5">{fmtTime(m.created_at)}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-5 py-4 border-t border-line shrink-0 relative">
          {/* Reply preview */}
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-white/[0.04] border-l-2 border-accent">
              <Reply size={13} className="text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] text-accent font-medium">Ответ · {replyTo.sender?.full_name ?? 'Пользователь'}</div>
                <div className="text-[12px] text-mute truncate">{replyTo.content}</div>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-mute hover:text-white shrink-0">
                <X size={14} />
              </button>
            </div>
          )}

          {showEmoji && (
            <div ref={emojiRef} className="absolute bottom-full left-5 mb-2 bg-[#1C2035] border border-line rounded-2xl p-3 shadow-2xl z-50 w-72">
              <div className="grid grid-cols-10 gap-0.5">
                {EMOJI_QUICK.map(e => (
                  <button key={e}
                    onClick={() => { setText(t => t + e); setShowEmoji(false); inputRef.current?.focus() }}
                    className="w-7 h-7 text-lg hover:bg-white/[0.08] rounded-lg flex items-center justify-center transition-all">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-line hover:border-line2 focus-within:border-accent/50 transition-all">
            <button onClick={() => setShowEmoji(v => !v)}
              className={`transition-colors shrink-0 ${showEmoji ? 'text-accent' : 'text-mute hover:text-white'}`}>
              <Smile size={18} />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={`Написать в #${activeCh?.name ?? ''}…`}
              className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-mute2"
            />
            <button onClick={send} disabled={!text.trim()}
              className="w-8 h-8 rounded-lg bg-accent/15 text-accent hover:bg-accent hover:text-white transition-all inline-flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Members panel ── */}
      <div className="w-[200px] shrink-0 border-l border-line hidden xl:flex flex-col">
        <div className="px-4 py-4 border-b border-line shrink-0">
          <span className="text-[11px] text-mute uppercase tracking-[0.12em] font-semibold">
            Участники · {members.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {members.map(m => (
            <button key={m.id} onClick={() => setViewUserId(m.id)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-all text-left">
              <div className="relative shrink-0">
                <Avatar initials={getInitials(m.full_name)} color={colorFor(m.full_name)} size={28} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-sidebar"
                  style={{ background: m.status === 'online' ? '#22C55E' : m.status === 'busy' ? '#F59E0B' : '#5A6188' }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium truncate">{m.full_name.split(' ')[0]}</div>
                <div className="text-[10.5px] text-mute2 truncate capitalize">{m.role}</div>
              </div>
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
      {viewUserId && <UserProfileModal userId={viewUserId} onClose={() => setViewUserId(null)} />}
    </div>
  )
}
