'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Loader2, Send } from 'lucide-react'
import { getInitials, colorFor } from '@/lib/utils'
import { processMentions } from '@/lib/mentions'

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string
  }
}

export function TaskComments({ taskId }: { taskId: string }) {
  const supabase = createClient()
  const { user } = useAuthStore()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let active = true
    const fetchComments = async () => {
      const { data } = await supabase
        .from('task_comments')
        .select('id, content, created_at, user:users!user_id(id, full_name)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })
      
      if (active && data) {
        setComments(data as unknown as Comment[])
      }
      setLoading(false)
    }
    fetchComments()
    return () => { active = false }
  }, [taskId, supabase])

  const sendComment = async () => {
    if (!text.trim() || !user) return
    setSending(true)
    
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
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
        processMentions(text.trim(), user.id, `/tasks?task=${taskId}`)
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

  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="text-[12.5px] font-bold tracking-tight mb-4">Комментарии</h3>
      
      <div className="space-y-4 mb-4 max-h-[240px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="text-[12px] text-mute2 text-center py-2">Нет комментариев. Напишите первым!</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <Avatar initials={getInitials(c.user?.full_name)} color={colorFor(c.user?.full_name || '')} size={32} />
              <div className="flex-1 min-w-0 bg-bg border border-line rounded-xl px-3.5 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-semibold">{c.user?.full_name || 'Пользователь'}</span>
                  <span className="text-[10px] text-mute">{new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="text-[13px] text-slate-700 whitespace-pre-wrap break-words">{c.content}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendComment()
            }
          }}
          placeholder="Написать комментарий (используйте @ для упоминания)..."
          rows={1}
          className="field flex-1 resize-none py-2.5"
          disabled={sending}
        />
        <Button onClick={sendComment} disabled={!text.trim() || sending} className="px-4 h-auto shrink-0">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </div>
    </div>
  )
}
