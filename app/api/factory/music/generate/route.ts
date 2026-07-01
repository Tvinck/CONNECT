import { NextResponse } from 'next/server';
import { createHiggsfieldClient } from '@higgsfield/client/v2';

export async function POST(req: Request) {
  try {
    const { prompt, duration } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Промпт для музыки не передан' }, { status: 400 });
    }

    const client = createHiggsfieldClient({ credentials: process.env.HIGGSFIELD_API_KEY });

    // Запускаем генерацию музыки Sonilo
    const response = await client.subscribe('sonilo_music', {
      input: {
        prompt: prompt,
        duration: duration || 30
      },
      withPolling: false
    });

    if (response && response.request_id) {
      return NextResponse.json({ taskId: response.request_id });
    }
    
    return NextResponse.json({ error: 'Не удалось получить ID задачи' }, { status: 500 });
  } catch (error: any) {
    console.error('Music Gen Error:', error?.response?.data || error.message);
    return NextResponse.json({ error: error?.response?.data?.detail || error.message }, { status: 500 });
  }
}
