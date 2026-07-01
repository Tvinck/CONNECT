const fs = require('fs');
const path = require('path');
const os = require('os');

function searchDir(dir, depth = 0) {
  if (depth > 4) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (e) {
        continue;
      }
      
      if (stat.isDirectory()) {
        if (f === 'node_modules' || f === '.git' || f === 'AppData' || f === '.gemini') continue;
        searchDir(fullPath, depth + 1);
      } else if (f === 'credentials.json' && dir.includes('higgsfield')) {
        console.log('FOUND:', fullPath);
      }
    }
  } catch (e) {}
}

const userHome = os.homedir();
console.log('Searching in User Home:', userHome);
searchDir(userHome);

// Also search AppData specifically
const appData = process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming');
const localAppData = path.join(userHome, 'AppData', 'Local');
console.log('Searching in AppData Roaming:', appData);
searchDir(appData);
console.log('Searching in AppData Local:', localAppData);
searchDir(localAppData);

console.log('Search finished.');
