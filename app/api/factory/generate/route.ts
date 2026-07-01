import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.tkbk.io/claude'
    const token = process.env.ANTHROPIC_AUTH_TOKEN

    if (!token) {
      return NextResponse.json({ error: 'API token not configured' }, { status: 500 })
    }

    const systemPrompt = `Ты - креативный сценарист для коротких вертикальных видео (YouTube Shorts, TikTok). 
Твоя задача писать 60-секундные сценарии от лица маскота: 'Енот Чилл' (мемный, современный енот-хакер в худи, который рассказывает инсайды, взламывает секреты истории, кино и мира).
Правила:
1. Хук (0-3 сек): Начни с шокирующего факта или интригующего вопроса. Без приветствий! Сразу в суть.
2. Тон: Ироничный, современный, иногда обращаешься к зрителям как 'братишки', 'хакеры' или 'чат'. Используй легкий сленг, но без перебора.
3. Длина: Строго 140-160 слов (это ровно 60 секунд озвучки).
4. Структура: Без воды. Только сочные факты.
5. Концовка: Быстрый призыв подписаться ("Подписывайся, пока не удалили" или подобное).
ВЫВОДИ ТОЛЬКО ТЕКСТ СЦЕНАРИЯ (то, что будет озвучивать диктор). Никаких ремарок для режиссера, никаких описаний кадров или музыки.`

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Тема для видео: ${topic}` }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API Error:', errorText)
      return NextResponse.json({ error: `API Error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    const script = data.content[0].text

    return NextResponse.json({ script })
  } catch (error: any) {
    console.error('Factory Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
