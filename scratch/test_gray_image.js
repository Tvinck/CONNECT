const { createHiggsfieldClient } = require('@higgsfield/client/v2');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
  const client = createHiggsfieldClient({ credentials: process.env.HIGGSFIELD_API_KEY });

  console.log('Testing kling-video/v2.1/pro/image-to-video WITH gray placeholder image...');
  try {
    const res = await client.subscribe('kling-video/v2.1/pro/image-to-video', {
      input: {
        image_url: 'https://placehold.co/1080x1920/333333/333333.png',
        prompt: 'A beautiful cinematic shot of retro Tiflis streets, cobblestone road, soft lighting, 9:16 aspect ratio',
        duration: 5
      },
      withPolling: false
    });
    console.log('Response:', res);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
