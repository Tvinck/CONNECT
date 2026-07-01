import { createHiggsfieldClient } from '@higgsfield/client/v2';

const client = createHiggsfieldClient({
  credentials: process.env.HIGGSFIELD_API_KEY
});

async function run() {
  try {
    const job = await client.subscribe('inworld_text_to_speech', {
      input: {
        prompt: "Тест",
        voice: "Dmitry (ru)"
      },
      withPolling: false
    });
    console.log(job);
  } catch(e) {
    console.error(e);
  }
}

run();
