const fs = require('fs');

const content = fs.readFileSync('c:\\Users\\Николай\\Desktop\\BAZZAR PROD\\veil-vpn\\tg-bot\\bot.js', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('sub') || line.includes('api/sub') || line.includes('http')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
