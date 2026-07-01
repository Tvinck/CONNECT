import { NextResponse } from 'next/server';
import { createHiggsfieldClient } from '@higgsfield/client/v2';

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    const client = createHiggsfieldClient({ credentials: process.env.HIGGSFIELD_API_KEY });
    
    // Подписываемся на задачу генерации аудио
    const response = await client.subscribe('inworld_text_to_speech', {
      input: {
        voice: "Dmitry (ru)",
        prompt: script
      },
      withPolling: false
    });

    if (response && response.request_id) {
      return NextResponse.json({ taskId: response.request_id });
    }
    
    return NextResponse.json({ error: 'Не удалось получить ID задачи' }, { status: 500 });
  } catch (error: any) {
    console.error('Audio Gen Error:', error?.response?.data || error.message);
    return NextResponse.json({ error: error?.response?.data?.detail || error.message }, { status: 500 });
  }
}
