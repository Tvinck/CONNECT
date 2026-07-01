const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: '.env.local' });

async function test() {
  const anthropicUrl = process.env.ANTHROPIC_BASE_URL;
  const anthropicKey = process.env.ANTHROPIC_AUTH_TOKEN;
  
  console.log('URL:', anthropicUrl);
  console.log('Key length:', anthropicKey?.length);

  const script = `Вы точно думаете, что знаете всё про дедушку Сталина? Окей, тогда вот вам цифры, от которых реально сносит башню. Иосиф Виссарионович — это вам не просто портрет в кабинете, это человек, который буквально перекроил карту мира. Начнём с того, что пацан из тифлисского захолустья, с грузинским акцентом и...`;

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

  console.log('Sending request to Claude...');
  const start = Date.now();
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
      })
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Duration:', (Date.now() - start) / 1000, 'seconds');
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
