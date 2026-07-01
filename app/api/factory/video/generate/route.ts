import { NextResponse } from 'next/server';
import { createHiggsfieldClient } from '@higgsfield/client/v2';

export async function POST(req: Request) {
  try {
    const { script, start_image, prompt: customPrompt } = await req.json();

    const finalPrompt = customPrompt || script;
    if (!finalPrompt) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }
    const client = createHiggsfieldClient({ credentials: process.env.HIGGSFIELD_API_KEY });

    // Всегда используем image-to-video с заглушкой, если нет маскота
    const finalImage = start_image || 'https://placehold.co/1080x1920/333333/333333.png';
    const response = await client.subscribe('kling-video/v2.1/pro/image-to-video', {
      input: {
        image_url: finalImage,
        prompt: finalPrompt,
        duration: 5
      },
      withPolling: false
    });

    if (response && response.request_id) {
      return NextResponse.json({ taskId: response.request_id });
    }
    
    return NextResponse.json({ error: 'Не удалось получить ID задачи' }, { status: 500 });
  } catch (error: any) {
    console.error('Video Gen Error:', error?.response?.data || error.message);
    return NextResponse.json({ error: error?.response?.data?.detail || error.message }, { status: 500 });
  }
}
