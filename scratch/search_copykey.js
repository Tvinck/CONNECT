const fs = require('fs');

const content = fs.readFileSync('c:\\Users\\Николай\\Desktop\\BAZZAR PROD\\connect\\components\\projects\\ProjectDetail.tsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('copyKey')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
