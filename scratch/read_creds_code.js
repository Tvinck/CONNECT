const fs = require('fs');
const path = require('path');

function getCode() {
  const file = 'C:\\Users\\Николай\\.gemini\\antigravity\\brain\\8b1b6922-52f4-4db4-bd7e-05e3d3525ece\\.system_generated\\logs\\transcript_full.jsonl';
  if (!fs.existsSync(file)) {
    console.log('File not found');
    return;
  }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes('"step_index":12754,')) {
      const obj = JSON.parse(line);
      console.log('FOUND STEP 12754:', JSON.stringify(obj, null, 2));
      break;
    }
  }
}

getCode();
