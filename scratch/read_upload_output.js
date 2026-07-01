const fs = require('fs');
const path = require('path');

function getOutput() {
  const file = 'C:\\Users\\Николай\\.gemini\\antigravity\\brain\\8b1b6922-52f4-4db4-bd7e-05e3d3525ece\\.system_generated\\logs\\transcript_full.jsonl';
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('node upload_creds.js')) {
      // Find the next system response (output)
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('"source":"SYSTEM"') || lines[j].includes('Upload success')) {
          console.log(`LINE ${j}:`, lines[j].substring(0, 1000));
        }
      }
    }
  }
}

getOutput();
