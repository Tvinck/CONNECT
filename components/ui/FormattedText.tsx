'use client'

import React from 'react'

/**
 * Рендерит текст с поддержкой базового форматирования:
 * - @упоминания (синий цвет)
 * - **жирный текст**
 * - *курсив*
 * - переносы строк
 */
export function FormattedText({ text }: { text: string }) {
  if (!text) return null

  // 1. Разбиваем по строкам
  const lines = text.split('\n')

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        // Заголовки
        if (line.startsWith('### ')) {
          return <h4 key={i} className="text-lg font-bold text-text mt-4 mb-2">{processLine(line.slice(4))}</h4>
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-xl font-black text-text mt-5 mb-3">{processLine(line.slice(3))}</h3>
        }
        if (line.startsWith('# ')) {
          return <h2 key={i} className="text-2xl font-black text-text mt-6 mb-4">{processLine(line.slice(2))}</h2>
        }
        
        // Списки
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 min-h-[1.25rem] pl-2">
              <span className="text-mute select-none">•</span>
              <span className="flex-1">{processLine(line.slice(2))}</span>
            </div>
          )
        }

        // Обычный текст
        return (
          <p key={i} className="min-h-[1.25rem] leading-relaxed">
            {processLine(line)}
          </p>
        )
      })}
    </div>
  )
}

function processLine(line: string) {
  if (!line) return null

  // Регулярка, которая ищет:
  // 1. **жирный** -> \*\*(.*?)\*\*
  // 2. *курсив* -> \*(.*?)\*
  // 3. @упоминание -> (@[a-zA-Z0-9_.]+)
  // 4. URL -> (https?:\/\/[^\s<]+[^<.,:;"')\]\s])
  const regex = /(\*\*.*?\*\*|\*.*?\*|@[a-zA-Z0-9_.]+|https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g
  const parts = line.split(regex)

  return parts.map((part, idx) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx} className="italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('@')) {
      return (
        <span key={idx} className="text-accent font-semibold bg-accent/10 px-1 rounded mx-0.5">
          {part}
        </span>
      )
    }
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">
          {part}
        </a>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}
