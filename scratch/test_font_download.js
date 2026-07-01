const fetch = require('node-fetch');
const fs = require('fs');

async function testFontDownload() {
  const url = 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf';
  console.log(`Downloading font from: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const headers = [...res.headers.entries()];
    console.log('Headers:', headers);
    if (!res.ok) {
      console.error('Failed download!');
      return;
    }
    const buffer = await res.buffer();
    console.log(`Downloaded buffer length: ${buffer.length} bytes`);
    if (buffer.length < 1000) {
      console.log('File content preview:', buffer.toString('utf8').substring(0, 200));
    }
  } catch (err) {
    console.error('Download error:', err.message);
  }
}

testFontDownload();
