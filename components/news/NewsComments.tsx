'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Loader2, Send } from 'lucide-react'
import { getInitials, colorFor } from '@/lib/utils'
import { processMentions } from '@/lib/mentions'
import { FormattedText } from '@/components/ui/FormattedText'

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string
  }
}

interface MentionUser {
  mention_tag: string
  full_name: string
}

export function NewsComments({ newsId }: { newsId: string }) {
  const supabase = createClient()
  const { user } = useAuthStore()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)

  useEffect(() => {
    supabase.from('users').select('mention_tag, full_name').not('mention_tag', 'is', null)
      .then(({ data }) => {
        if (data) setMentionUsers(data as MentionUser[])
      })
  }, [supabase])

  useEffect(() => {
    let active = true
    const fetchComments = async () => {
      const { data } = await supabase
        .from('news_comments')
        .select('id, content, created_at, user:users!user_id(id, full_name)')
        .eq('news_id', newsId)
        .order('created_at', { ascending: true })
      
      if (active && data) {
        setComments(data as unknown as Comment[])
      }
      setLoading(false)
    }
    fetchComments()
    return () => { active = false }
  }, [newsId, supabase])

  const sendComment = async () => {
    if (!text.trim() || !user) return
    setSending(true)
    
    try {
      const { data, error } = await supabase
        .from('news_comments')
        .insert({
          news_id: newsId,
          user_id: user.id,
          content: text.trim()
        })
        .select('id, content, created_at, user:users!user_id(id, full_name)')
        .single()
        
      if (error) throw error
      if (data) {
        setComments(prev => [...prev, data as unknown as Comment])
        setText('')
        // Process mentions asynchronously
        processMentions(text.trim(), user.id, `/news/${newsId}`, 'в новости')
      }
    } catch (err) {
      console.error('Failed to send comment', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin text-mute" /></div>
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)
    
    const cursor = e.target.selectionStart
    const textBefore = val.slice(0, cursor)
    const match = textBefore.match(/@([a-zA-Z0-9_.]*)$/)
    
    if (match) {
      setShowMentions(true)
      setMentionFilter(match[1].toLowerCase())
      setMentionIndex(0)
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (tag: string) => {
    const textarea = document.getElementById('news-comment-textarea') as HTMLTextAreaElement
    if (!textarea) return
    const cursor = textarea.selectionStart
    const textBefore = text.slice(0, cursor)
    const textAfter = text.slice(cursor)
    
    const match = textBefore.match(/@([a-zA-Z0-9_.]*)$/)
    if (match) {
      const newText = textBefore.slice(0, match.index) + `@${tag} ` + textAfter
      setText(newText)
      setShowMentions(false)
      // Set cursor position back inside after React render
      setTimeout(() => {
        textarea.focus()
        const newPos = match.index! + tag.length + 2 // +2 for @ and space
        textarea.setSelectionRange(newPos, newPos)
      }, 10)
    }
  }

  const filteredUsers = mentionUsers.filter(u => 
    u.mention_tag.toLowerCase().includes(mentionFilter) || 
    u.full_name.toLowerCase().includes(mentionFilter)
  ).slice(0, 5)

  return (
    <div className="mt-8 border-t border-line pt-8 max-w-3xl mx-auto">
      <h3 className="text-lg font-bold tracking-tight mb-6">Комментарии</h3>
      
      <div className="space-y-5 mb-8">
        {comments.length === 0 ? (
          <div className="text-sm text-mute text-center py-6 bg-card border border-line rounded-2xl">Нет комментариев. Напишите первым!</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-4">
              <Avatar initials={getInitials(c.user?.full_name)} color={colorFor(c.user?.full_name || '')} size={40} />
              <div className="flex-1 min-w-0 bg-card border border-line rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-text">{c.user?.full_name || 'Пользователь'}</span>
                  <span className="text-[11px] font-medium text-mute">{new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="text-sm text-slate-700 break-words">
                  <FormattedText text={c.content} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="relative flex gap-3">
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-[240px] bg-card border border-line rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
            {filteredUsers.map((u, i) => (
              <button
                key={u.mention_tag}
                onClick={() => insertMention(u.mention_tag)}
                className={`w-full text-left px-3 py-2 text-[12.5px] hover:bg-bg transition-colors flex flex-col ${i === mentionIndex ? 'bg-bg' : ''}`}
              >
                <span className="font-semibold text-slate-800">{u.full_name}</span>
                <span className="text-mute text-[11px]">@{u.mention_tag}</span>
              </button>
            ))}
          </div>
        )}
        <textarea
          id="news-comment-textarea"
          value={text}
          onChange={handleTextChange}
          onKeyDown={e => {
            if (showMentions && filteredUsers.length > 0) {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1))
                return
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionIndex(i => Math.max(i - 1, 0))
                return
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                insertMention(filteredUsers[mentionIndex].mention_tag)
                return
              }
              if (e.key === 'Escape') {
                setShowMentions(false)
                return
              }
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendComment()
            }
          }}
          placeholder="Написать комментарий (используйте @ для упоминания)..."
          rows={2}
          className="field flex-1 resize-none py-3 px-4 text-sm bg-card rounded-2xl shadow-sm"
          disabled={sending}
        />
        <Button onClick={sendComment} disabled={!text.trim() || sending} className="px-5 h-auto shrink-0 shadow-sm rounded-2xl">
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </Button>
      </div>
    </div>
  )
}
