const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\Николай\\Desktop\\BAZZAR PROD';
const searchStr = 'fhwrdhebhgywhvoeqpxj';

function searchDir(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }

  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }

    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === '.next' || file === 'dist') continue;
      searchDir(fullPath);
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(searchStr)) {
          console.log(`Found in: ${fullPath}`);
          // Print lines containing searchStr
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes(searchStr) || line.toLowerCase().includes('password') || line.toLowerCase().includes('postgres')) {
              console.log(`  L${idx+1}: ${line.trim()}`);
            }
          });
        }
      } catch (e) {}
    }
  }
}

console.log(`Searching for "${searchStr}" in ${rootDir}...`);
searchDir(rootDir);
