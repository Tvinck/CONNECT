const fs = require('fs');
const path = require('path');

function getFluxModel() {
  const file = 'C:\\Users\\Николай\\.gemini\\antigravity\\brain\\8b1b6922-52f4-4db4-bd7e-05e3d3525ece\\.system_generated\\logs\\transcript_full.jsonl';
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('flux_') || lines[i].includes('flux-')) {
      console.log(`LINE ${i}:`, lines[i].substring(0, 1000));
    }
  }
}

getFluxModel();
