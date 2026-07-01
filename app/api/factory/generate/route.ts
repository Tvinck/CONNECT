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
Твоя задача писать познавательные, очень интересные 60-секундные сценарии от лица маскота: 'Енот Чилл'.
Стиль подачи: как у популярного канала "Истории от Кисы". Просто о сложном, захватывающе, молодежно, с фактами, от которых сносит крышу!
Правила:
1. Хук (0-3 сек): Начни с безумного факта или вопроса, который заставит досмотреть до конца. (Без приветствий!)
2. Тон: Познавательный, но драйвовый и молодежный. Обращайся к зрителям как 'чат' или 'братишки'. Никакой нудятины из Википедии, только сок!
3. Длина: Строго 130-150 слов (идеально для 60 секунд быстрой дикторской речи).
4. Концовка: Призыв к действию (лайк/подписка), чтобы узнать еще больше секретов.
ВЫВОДИ ТОЛЬКО ТЕКСТ СЦЕНАРИЯ (текст для диктора). Никаких ремарок или описаний кадров.`

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
