'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ChevronUp, ChevronDown, MessageSquare, Clock, Eye,
  Send, Trash2, Loader2, ThumbsUp, ThumbsDown, Link as LinkIcon, Paperclip
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useUIStore } from '@/store/ui'
import { getInitials, colorFor, timeAgo } from '@/lib/utils'
import { CATEGORY_META, type Idea } from './IdeasClient'
import { processMentions } from '@/lib/mentions'

type Comment = {
  id: string
  content: string
  attachments: string[]
  created_at: string
  author: { id: string; full_name: string } | null
}

interface Props {
  idea: Idea
  projects: { id: string; name: string; color: string; emoji: string | null }[]
  users?: { id: string; full_name: string; mention_tag?: string }[]
  currentUser: { id: string; full_name: string; role: string | null }
  onClose: () => void
  onVote: (type: 'up' | 'down') => void
  onDelete: (id: string) => void
  onUpdate: (updatedIdea: Idea) => void
}

export function IdeaDetailsModal({ idea, projects, users = [], currentUser, onClose, onVote, onDelete, onUpdate }: Props) {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const addToast = useUIStore(s => s.addToast)

  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Comment attachments
  const commentFileRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Mentions
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)

  // Lock background scroll while open + close on Escape.
  // Escape is ignored while the @mention popup is open, so it closes that popup first.
  const showMentionsRef = useRef(showMentions)
  showMentionsRef.current = showMentions
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showMentionsRef.current) onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const isAuthor = currentUser.id === idea.author_id
  const isCeoOrCoowner = currentUser.role === 'ceo' || currentUser.role === 'coowner'
  const score = idea.votes.reduce((sum, v) => sum + v.value, 0)
  const userVote = idea.votes.find(v => v.user_id === currentUser.id)?.value

  // Fetch comments & increment views once on mount
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('idea_comments')
        .select('*, author:users!author_id(id, full_name)')
        .eq('idea_id', idea.id)
        .order('created_at', { ascending: true })
      if (data) setComments(data as any[])
      setLoadingComments(false)
    }

    const incrementViews = async () => {
      const nextViews = (idea.views ?? 0) + 1
      await supabase.from('ideas').update({ views: nextViews }).eq('id', idea.id)
      onUpdate({ ...idea, views: nextViews })
    }

    fetchComments()
    incrementViews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea.id])

  // Listen for Clipboard Paste (Ctrl+V) inside the comment area
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only paste if comment input or comment area is focused/hovered
      const active = document.activeElement
      if (active && (active.id === 'comment-textarea' || active.tagName === 'BODY')) {
        if (!e.clipboardData) return
        const items = e.clipboardData.items
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile()
            if (file) {
              setAttachedFile(file)
              if (previewUrl) URL.revokeObjectURL(previewUrl)
              setPreviewUrl(URL.createObjectURL(file))
              addToast('Изображение вставлено', 'Скриншот прикреплен к комментарию', 'accent')
              e.preventDefault()
            }
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [previewUrl, addToast])

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setAttachedFile(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const deleteAttachment = () => {
    setAttachedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  // Submit comment
  const postComment = async () => {
    if (!commentText.trim() && !attachedFile) return
    setSendingComment(true)
    let uploadedUrl: string | null = null

    try {
      if (attachedFile) {
        const fileExt = attachedFile.name.split('.').pop() || 'png'
        const filePath = `comments/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('idea-attachments')
          .upload(filePath, attachedFile)

        if (uploadErr) {
          throw new Error('Не удалось загрузить изображение: ' + uploadErr.message)
        }

        const { data: publicUrlData } = supabase.storage
          .from('idea-attachments')
          .getPublicUrl(filePath)

        uploadedUrl = publicUrlData?.publicUrl ?? null
      }

      const { data, error: dbErr } = await supabase
        .from('idea_comments')
        .insert({
          idea_id: idea.id,
          author_id: currentUser.id,
          content: commentText.trim(),
          attachments: uploadedUrl ? [uploadedUrl] : []
        })
        .select('*, author:users!author_id(id, full_name)')
        .single()

      if (dbErr) throw dbErr

      if (data) {
        setComments(prev => [...prev, data as any])
        setCommentText('')
        deleteAttachment()
        addToast('Комментарий отправлен', '', 'ok')

        // Update comments count on main page
        const updatedComments = [...(idea.comments ?? []), { id: data.id }]
        onUpdate({ ...idea, comments: updatedComments })

        if (commentText.trim()) {
          processMentions(commentText.trim(), currentUser.id, `/ideas?idea=${idea.id}`)
        }
      }
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось опубликовать комментарий', 'err')
    } finally {
      setSendingComment(false)
    }
  }

  // Update Status Handler
  const handleStatusChange = async (newStatus: 'new' | 'planned' | 'rejected' | 'implemented') => {
    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ status: newStatus })
        .eq('id', idea.id)

      if (error) throw error

      onUpdate({ ...idea, status: newStatus })
      addToast('Статус обновлен', `Новый статус: ${CATEGORY_META[newStatus].label}`, 'ok')
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось обновить статус', 'err')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Delete Idea Handler
  const handleDeleteIdea = async () => {
    if (!confirm('Вы действительно хотите удалить эту идею навсегда?')) return

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', idea.id)

      if (error) throw error

      onDelete(idea.id)
      addToast('Успешно', 'Идея удалена', 'ok')
      onClose()
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось удалить идею', 'err')
    }
  }

  const statusMeta = CATEGORY_META[idea.status]
  const StatusIcon = statusMeta?.icon || ThumbsUp

  const fmtDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setCommentText(val)
    
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
    const textarea = document.getElementById('comment-textarea') as HTMLTextAreaElement
    if (!textarea) return
    const cursor = textarea.selectionStart
    const textBefore = commentText.slice(0, cursor)
    const textAfter = commentText.slice(cursor)
    
    const match = textBefore.match(/@([a-zA-Z0-9_.]*)$/)
    if (match) {
      const newText = textBefore.slice(0, match.index) + `@${tag} ` + textAfter
      setCommentText(newText)
      setShowMentions(false)
      setTimeout(() => {
        textarea.focus()
        const newPos = match.index! + tag.length + 2
        textarea.setSelectionRange(newPos, newPos)
      }, 10)
    }
  }

  const filteredUsers = users
    .filter(u => u.mention_tag)
    .filter(u => 
      u.mention_tag!.toLowerCase().includes(mentionFilter) || 
      u.full_name.toLowerCase().includes(mentionFilter)
    ).slice(0, 5)

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-card border border-line rounded-2xl w-full max-w-[720px] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-modal-in text-[#171821]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: `${statusMeta.color}15`, color: statusMeta.color }}
            >
              <StatusIcon size={12} />
              {statusMeta.label}
            </span>
            <span className="text-[12px] text-mute flex items-center gap-1 font-mono">
              <Eye size={12} />
              {idea.views ?? 0}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-mute hover:text-[#171821] hover:bg-bg transition-all inline-flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Main Info */}
          <div>
            <h1 className="text-[20px] font-extrabold tracking-tight leading-snug text-[#171821] font-sans">
              {idea.title}
            </h1>
            
            {/* Author details */}
            {idea.author && (
              <div className="flex items-center gap-2 mt-3 text-[12px] text-mute">
                <Avatar
                  initials={getInitials(idea.author.full_name)}
                  color={colorFor(idea.author.full_name)}
                  size={22}
                />
                <span className="font-semibold text-[#171821]">{idea.author.full_name}</span>
                <span>·</span>
                <span>{fmtDate(idea.created_at)}</span>
              </div>
            )}
          </div>

          {/* Description Container */}
          <div className="bg-bg/50 border border-line rounded-xl p-5 space-y-4">
            <div className="text-[14px] text-[#171821] leading-relaxed whitespace-pre-wrap">
              {idea.description}
            </div>

            {/* Attachments List */}
            {idea.attachments?.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] uppercase tracking-[0.08em] text-mute2 font-semibold block">Вложения</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {idea.attachments.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video rounded-lg overflow-hidden border border-line bg-bg hover:border-accent transition-all group cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Вложение идеи" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Links List */}
            {idea.links?.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] uppercase tracking-[0.08em] text-mute2 font-semibold block">Ссылки</span>
                <div className="space-y-1">
                  {idea.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[12.5px] text-accent hover:text-accent/80 font-medium font-mono hover:underline truncate"
                    >
                      <LinkIcon size={13} className="shrink-0" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Voting block inside card */}
            <div className="flex items-center justify-between pt-4 border-t border-line mt-4">
              <span className="text-[13px] text-mute">Оцените идею:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onVote('up')}
                  className={`flex items-center gap-1.5 px-3 h-8.5 rounded-xl border text-[12.5px] font-semibold transition-all ${
                    userVote === 1
                      ? 'bg-accent/15 border border-accent/25 text-accent font-bold'
                      : 'bg-bg border border-line text-[#171821] hover:bg-bg-hover hover:border-line2'
                  }`}
                >
                  <ThumbsUp size={13} />
                  Поддержать
                </button>
                <button
                  onClick={() => onVote('down')}
                  className={`flex items-center justify-center w-8.5 h-8.5 rounded-xl border transition-all ${
                    userVote === -1
                      ? 'bg-warn/15 border border-warn/25 text-warn font-bold'
                      : 'bg-bg border border-line text-[#171821] hover:bg-bg-hover hover:border-line2'
                  }`}
                  title="Не поддерживаю"
                >
                  <ThumbsDown size={13} />
                </button>
                <span className="text-[14px] font-bold text-[#171821] ml-2 font-mono">{score}</span>
              </div>
            </div>
          </div>

          {/* CEO status management & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-line bg-bg/50">
            <div className="flex items-center gap-3">
              {isCeoOrCoowner && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-mute shrink-0">
                    Управление:
                  </span>
                  <select
                    value={idea.status}
                    onChange={e => handleStatusChange(e.target.value as any)}
                    disabled={updatingStatus}
                    className="h-8.5 px-2.5 rounded-lg bg-card border border-line text-[#171821] font-medium focus:border-accent cursor-pointer outline-none"
                  >
                    <option value="new">Новая идея</option>
                    <option value="planned">Запланировано</option>
                    <option value="rejected">Отклонено</option>
                    <option value="implemented">Реализовано</option>
                  </select>
                  {updatingStatus && <Loader2 size={13} className="animate-spin text-slate-400" />}
                </div>
              )}
            </div>

            {/* Delete button (owner or CEO) */}
            {(isAuthor || isCeoOrCoowner) && (
              <button
                onClick={handleDeleteIdea}
                className="flex items-center gap-1.5 px-3 h-8.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-500 text-[12.5px] font-medium transition-all ml-auto"
              >
                <Trash2 size={13} />
                Удалить идею
              </button>
            )}
          </div>

          {/* Comments section */}
          <div className="space-y-4">
            <h3 className="text-[14px] font-bold text-[#171821] tracking-tight flex items-center gap-2">
              <MessageSquare size={16} />
              Обсуждение · {comments.length}
            </h3>

            {/* Comment input block */}
            <div className="bg-bg/50 border border-line rounded-xl p-3.5 space-y-3 relative">
              
              {/* Mentions Dropdown */}
              {showMentions && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-[240px] bg-card border border-line rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                  {filteredUsers.map((u, i) => (
                    <button
                      key={u.mention_tag}
                      onClick={() => insertMention(u.mention_tag!)}
                      className={`w-full text-left px-3 py-2 text-[12.5px] hover:bg-card-hover transition-colors flex flex-col ${i === mentionIndex ? 'bg-bg' : ''}`}
                    >
                      <span className="font-semibold text-[#171821]">{u.full_name}</span>
                      <span className="text-mute text-[11px]">@{u.mention_tag}</span>
                    </button>
                  ))}
                </div>
              )}

              <textarea
                id="comment-textarea"
                value={commentText}
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
                      insertMention(filteredUsers[mentionIndex].mention_tag!)
                      return
                    }
                    if (e.key === 'Escape') {
                      setShowMentions(false)
                      return
                    }
                  } else if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    postComment()
                  }
                }}
                placeholder="Напишите ваш комментарий (используйте @ для упоминания)…"
                rows={2}
                className="w-full bg-transparent border-0 outline-none text-[13.5px] placeholder:text-mute2 text-[#171821] resize-none"
                disabled={sendingComment}
              />

              {/* Preview attached screenshot */}
              {previewUrl && (
                <div className="relative group w-24 aspect-video rounded-lg border border-line overflow-hidden bg-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Вложение" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={deleteAttachment}
                    className="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {/* Action Buttons inside comment block */}
              <div className="flex items-center justify-between border-t border-line pt-3">
                <div className="flex items-center">
                  <input
                    type="file"
                    ref={commentFileRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => commentFileRef.current?.click()}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      previewUrl ? 'text-accent bg-accent/10' : 'text-mute hover:text-[#171821] hover:bg-bg'
                    }`}
                    title="Прикрепить изображение"
                    disabled={sendingComment}
                  >
                    <Paperclip size={14} />
                  </button>
                </div>
                <button
                  onClick={postComment}
                  disabled={sendingComment || (!commentText.trim() && !attachedFile)}
                  className="bg-accent hover:bg-accent/80 text-white font-semibold text-[12px] px-3.5 h-8.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-sm"
                >
                  {sendingComment ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  Отправить
                </button>
              </div>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="flex items-center justify-center py-6 text-[13px] text-slate-500">
                <Loader2 size={16} className="animate-spin mr-1.5" />
                Загрузка комментариев…
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-line rounded-xl text-mute text-[12.5px]">
                Комментариев пока нет. Будьте первыми!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(c => {
                  const initials = getInitials(c.author?.full_name ?? '')
                  const color = colorFor(c.author?.full_name ?? '')

                  return (
                    <div key={c.id} className="flex gap-3 items-start">
                      <Avatar initials={initials} color={color} size={28} className="shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 bg-card border border-line rounded-xl p-3.5 shadow-sm">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-[13px] font-bold text-[#171821]">
                            {c.author?.full_name ?? 'Пользователь'}
                          </span>
                          <span className="text-[10.5px] text-mute font-mono">
                            {timeAgo(c.created_at)}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#171821] leading-relaxed whitespace-pre-wrap">
                          {c.content}
                        </p>

                        {/* Comment Attachment */}
                        {c.attachments?.length > 0 && (
                          <div className="mt-3 max-w-[200px] rounded-lg overflow-hidden border border-line bg-bg">
                            <a href={c.attachments[0]} target="_blank" rel="noopener noreferrer" className="cursor-zoom-in block aspect-video">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={c.attachments[0]} alt="Скриншот в комментарии" className="w-full h-full object-cover hover:scale-105 transition-all duration-200" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
