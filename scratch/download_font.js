const fs = require('fs');
const path = require('path');

async function download() {
  const url = 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf';
  const destDir = path.join(__dirname, '..', 'public', 'fonts');
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const destPath = path.join(destDir, 'Montserrat-Bold.ttf');
  console.log('Downloading Montserrat-Bold.ttf to:', destPath);
  
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
