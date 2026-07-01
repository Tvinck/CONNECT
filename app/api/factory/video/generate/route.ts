import { NextResponse } from 'next/server';
import { createHiggsfieldClient } from '@higgsfield/client/v2';

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    const client = createHiggsfieldClient({ credentials: process.env.HIGGSFIELD_API_KEY });
    
    // Подписываемся на задачу генерации
    const response = await client.subscribe('kling-video/v2.1/pro/image-to-video', {
      input: {
        image_url: 'https://connect-4va6.vercel.app/mascot.png',
        prompt: script,
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
