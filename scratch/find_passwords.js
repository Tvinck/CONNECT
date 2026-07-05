const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\Николай\\Desktop\\BAZZAR PROD';

function findPasswords(dir) {
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
      findPasswords(fullPath);
    } else {
      if (file.startsWith('.env') || file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (
              (line.toLowerCase().includes('pass') || line.toLowerCase().includes('db_') || line.toLowerCase().includes('database_url')) &&
              !line.includes('searchStr') && line.includes('=')
            ) {
              console.log(`${fullPath}:L${idx+1}: ${line.trim()}`);
            }
          });
        } catch (e) {}
      }
    }
  }
}

console.log('Searching for credentials/passwords in config files...');
findPasswords(rootDir);
