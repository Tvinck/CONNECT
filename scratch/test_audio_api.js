const { createHiggsfieldClient } = require('@higgsfield/client/v2');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
  const client = createHiggsfieldClient({ credentials: process.env.HIGGSFIELD_API_KEY });

  console.log('Testing inworld_text_to_speech on Developer API...');
  try {
    const res = await client.subscribe('inworld_text_to_speech', {
      input: {
        prompt: 'Привет, как дела? Это тестовая озвучка от Енота.',
        voice: 'Dmitry (ru)'
      },
      withPolling: false
    });
    console.log('Audio API Success! Response:', res);
  } catch (err) {
    console.error('Audio API Failed! Error:', err.response?.data || err.message);
  }
}

test();
