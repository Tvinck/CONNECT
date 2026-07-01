import { NextResponse } from 'next/server';
import { createHiggsfieldClient } from '@higgsfield/client/v2';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Промпт не передан' }, { status: 400 });
    }

    const client = createHiggsfieldClient({ credentials: process.env.HIGGSFIELD_API_KEY });

    // Запускаем генерацию изображения Flux.2
    const response = await client.subscribe('flux_2', {
      input: {
        prompt: prompt,
        aspect_ratio: '9:16',
        model: 'pro',
        resolution: '1k'
      },
      withPolling: false
    });

    if (response && response.request_id) {
      return NextResponse.json({ taskId: response.request_id });
    }
    
    return NextResponse.json({ error: 'Не удалось получить ID задачи' }, { status: 500 });
  } catch (error: any) {
    console.error('Image Gen Error:', error?.response?.data || error.message);
    return NextResponse.json({ error: error?.response?.data?.detail || error.message }, { status: 500 });
  }
}
