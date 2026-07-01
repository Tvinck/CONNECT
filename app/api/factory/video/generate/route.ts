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

    // Если есть картинка - используем image-to-video, иначе text-to-video
    const model = start_image ? 'kling-video/v2.1/pro/image-to-video' : 'kling-video/v2.1/pro/text-to-video';
    const inputPayload: any = {
      prompt: finalPrompt,
      duration: 5
    };
    if (start_image) {
      inputPayload.image_url = start_image;
    } else {
      inputPayload.aspect_ratio = '9:16';
    }

    const response = await client.subscribe(model, {
      input: inputPayload,
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
