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

    const host = req.headers.get('host') || 'connect-4va6.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const mascotUrl = `${protocol}://${host}/mascot.png`;

    let finalImage = start_image || 'https://placehold.co/1080x1920/333333/333333.png';
    // Если передан UUID маскота или не валидный URL, подменяем на абсолютную ссылку на mascot.png
    if (finalImage === '1b2ef010-50b6-4a19-8db6-8707d03013b9' || !finalImage.startsWith('http')) {
      finalImage = mascotUrl;
    }

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
