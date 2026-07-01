const { createHiggsfieldClient } = require('@higgsfield/client/v2');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
  const client = createHiggsfieldClient({ credentials: process.env.HIGGSFIELD_API_KEY });

  console.log('Testing Kling 3.0 Turbo Text-to-Video...');
  try {
    const res = await client.subscribe('kling3_0_turbo', {
      input: {
        prompt: 'A beautiful shot of retro Tiflis streets, cobblestone road, soft lighting, 9:16 aspect ratio',
        aspect_ratio: '9:16',
        duration: 5
      },
      withPolling: false
    });
    console.log('Text-to-Video Response:', res);
  } catch (err) {
    console.error('Text-to-Video Error:', err.response?.data || err.message);
  }

  console.log('\nTesting Kling 3.0 Turbo Image-to-Video...');
  try {
    const res = await client.subscribe('kling3_0_turbo', {
      input: {
        prompt: 'Raccoon talking to camera',
        aspect_ratio: '9:16',
        duration: 5,
        medias: [
          {
            role: 'start_image',
            url: 'https://files.catbox.moe/d45nqz.png'
          }
        ]
      },
      withPolling: false
    });
    console.log('Image-to-Video Response:', res);
  } catch (err) {
    console.error('Image-to-Video Error:', err.response?.data || err.message);
  }
}

test();
