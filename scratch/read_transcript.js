const fs = require('fs');
const path = require('path');

function search() {
  const file = 'C:\\Users\\Николай\\.gemini\\antigravity\\brain\\8b1b6922-52f4-4db4-bd7e-05e3d3525ece\\.system_generated\\logs\\transcript.jsonl';
  if (!fs.existsSync(file)) {
    console.log('Transcript file not found at:', file);
    return;
  }
  
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  console.log(`Searching in ${lines.length} lines...`);
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('upload_creds') || lines[i].includes('upload_creds.js')) {
      console.log(`LINE ${i}:`, lines[i].substring(0, 1000));
    }
  }
}

search();
