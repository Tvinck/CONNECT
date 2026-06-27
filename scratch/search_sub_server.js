const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/Николай/Desktop/BAZZAR PROD/veil-vpn/tg-bot/sub_server.js';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('dns') || line.includes('DNS') || line.includes('template') || line.includes('routing') || line.includes('outbound')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('File sub_server.js not found at:', filePath);
}
