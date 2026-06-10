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
    <div className="space-y-1">
      {lines.map((line, i) => (
        <p key={i} className="min-h-[1rem]">
          {processLine(line)}
        </p>
      ))}
    </div>
  )
}

function processLine(line: string) {
  if (!line) return null

  // Регулярка, которая ищет:
  // 1. **жирный** -> \*\*(.*?)\*\*
  // 2. *курсив* -> \*(.*?)\*
  // 3. @упоминание -> (@[a-zA-Z0-9_.]+)
  const regex = /(\*\*.*?\*\*|\*.*?\*|@[a-zA-Z0-9_.]+)/g
  const parts = line.split(regex)

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx} className="italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('@')) {
      return (
        <span key={idx} className="text-blue-500 font-semibold bg-blue-500/10 px-1 rounded mx-0.5">
          {part}
        </span>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}
