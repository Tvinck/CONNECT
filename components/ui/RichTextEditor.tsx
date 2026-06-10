'use client'

import React, { useRef } from 'react'
import { Bold, Italic, AtSign } from 'lucide-react'

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Введите текст..." 
}: { 
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormat = (prefix: string, suffix: string) => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const text = el.value

    const before = text.substring(0, start)
    const selection = text.substring(start, end)
    const after = text.substring(end)

    const newText = before + prefix + selection + suffix + after
    onChange(newText)

    // Возвращаем фокус и курсор на место (после рендера)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  const handleBold = () => insertFormat('**', '**')
  const handleItalic = () => insertFormat('*', '*')
  const handleMention = () => insertFormat('@', '')

  return (
    <div className="border border-border rounded-xl bg-bg-soft overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-blue-500/50 transition-shadow">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border p-2 bg-[#171821]">
        <button 
          type="button" 
          onClick={handleBold} 
          className="p-1.5 rounded-lg hover:bg-border/50 text-text-muted hover:text-text transition-colors"
          title="Жирный (Bold)"
        >
          <Bold size={16} />
        </button>
        <button 
          type="button" 
          onClick={handleItalic} 
          className="p-1.5 rounded-lg hover:bg-border/50 text-text-muted hover:text-text transition-colors"
          title="Курсив (Italic)"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button 
          type="button" 
          onClick={handleMention} 
          className="p-1.5 rounded-lg hover:bg-border/50 text-text-muted hover:text-text flex items-center gap-1 transition-colors text-xs font-medium"
          title="Упомянуть сотрудника"
        >
          <AtSign size={14} /> Упомянуть
        </button>
      </div>

      {/* Editor Area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[120px] bg-transparent resize-none p-3 outline-none text-sm text-text"
      />
    </div>
  )
}
