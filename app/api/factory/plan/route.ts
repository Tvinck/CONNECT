import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    const anthropicUrl = process.env.ANTHROPIC_BASE_URL;
    const anthropicKey = process.env.ANTHROPIC_AUTH_TOKEN;

    if (!anthropicUrl || !anthropicKey) {
      return NextResponse.json({ error: 'Ключи Claude не настроены' }, { status: 500 });
    }

    const systemPrompt = `You are an AI Video Director. Your task is to take a user's text script and break it down into short scenes for a video generation model.
The video will be generated using a 5-second per scene limit. 
Break the script into short sentences or phrases (roughly 4-7 seconds of speaking time each).
Alternate between showing the Mascot (a Raccoon) and showing B-Roll (contextual videos).
The FIRST scene MUST be the Mascot.

For Mascot scenes:
- Set "isMascot" to true.
- Visual prompt: "A realistic raccoon standing and talking to the camera, lips moving, speaking, expressive face, 9:16 aspect ratio" (You can slightly vary the emotion based on the text).

For B-Roll scenes:
- Set "isMascot" to false.
- Visual prompt: A detailed prompt describing a beautiful, high-quality, cinematic 9:16 video scene that visually illustrates the text. Do NOT mention raccoons in B-Roll unless the text specifically requires it.

Return ONLY a JSON array of objects with the following format:
[
  {
    "text": "The exact text spoken in this scene",
    "prompt": "The visual prompt for the video generation model",
    "isMascot": true/false
  }
]
No markdown blocks, just the raw JSON array.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${anthropicUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anthropicKey}`,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: `Script:\n${script}` }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API Error:', errorText);
        return NextResponse.json({ error: 'Ошибка при планировании сцен (Claude)' }, { status: 500 });
      }

      const data = await response.json();
      const rawText = data.content?.[0]?.text?.trim() || '';
      
      // Clean up markdown if the LLM accidentally added it
      const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let scenes = [];
      try {
        scenes = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse LLM JSON:', jsonStr);
        return NextResponse.json({ error: 'Ошибка при разборе плана сцен' }, { status: 500 });
      }

      return NextResponse.json({ scenes });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        console.error('Claude API request timed out');
        return NextResponse.json({ error: 'Запрос к Claude превысил лимит времени (45 сек)' }, { status: 504 });
      }
      throw fetchErr;
    }

  } catch (error: any) {
    console.error('Planner Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
