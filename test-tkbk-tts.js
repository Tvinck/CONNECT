const fs = require('fs');

async function test() {
  try {
    const res = await fetch('https://api.tkbk.io/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer cr_fd981a66c0f87ed8758b4f5bf0e602700ee73b7a0a722b3d07b914ace66b46b8',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx',
        input: 'Привет, это тест'
      })
    });
    console.log(res.status, res.statusText);
    const data = await res.arrayBuffer();
    console.log('Bytes:', data.byteLength);
  } catch(e) {
    console.log(e.message);
  }
}
test();
