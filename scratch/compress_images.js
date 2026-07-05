const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const mascotRaw = path.join(__dirname, 'mascot_raw.png');
const logoRaw = path.join(__dirname, 'logo_raw.png');

const mascotComp = path.join(__dirname, 'mascot_comp.png');
const logoComp = path.join(__dirname, 'logo_comp.png');

console.log('FFmpeg binary path:', ffmpegPath);

if (fs.existsSync(mascotRaw)) {
  console.log('Compressing mascot...');
  execSync(`"${ffmpegPath}" -y -i "${mascotRaw}" -vf scale=512:512 "${mascotComp}"`);
  const oldSize = fs.statSync(mascotRaw).size;
  const newSize = fs.statSync(mascotComp).size;
  console.log(`Mascot compressed: ${(oldSize/1024/1024).toFixed(2)} MB -> ${(newSize/1024).toFixed(2)} KB`);
} else {
  console.error('Mascot raw file not found!');
}

if (fs.existsSync(logoRaw)) {
  console.log('Compressing logo...');
  execSync(`"${ffmpegPath}" -y -i "${logoRaw}" -vf scale=512:512 "${logoComp}"`);
  const oldSize = fs.statSync(logoRaw).size;
  const newSize = fs.statSync(logoComp).size;
  console.log(`Logo compressed: ${(oldSize/1024/1024).toFixed(2)} MB -> ${(newSize/1024).toFixed(2)} KB`);
} else {
  console.error('Logo raw file not found!');
}
