const fs = require('fs');
const path = require('path');

async function download() {
  const url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';
  const destDir = path.join(__dirname, '..', 'public', 'music');
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const destPath = path.join(destDir, 'lofi.mp3');
  console.log('Downloading lofi track from SoundHelix to:', destPath);
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    console.log('Download complete!');
  } catch (err) {
    console.error('Download failed:', err);
  }
}

download();
