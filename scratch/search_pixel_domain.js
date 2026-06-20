const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.git_backup' && file !== '.next' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (matches) {
          matches.forEach(url => {
            if (!url.includes('supabase') && !url.includes('yandex') && !url.includes('localhost') && !url.includes('schema') && !url.includes('w3.org') && !url.includes('vite') && !url.includes('telegram')) {
              console.log(`Found in ${fullPath}: ${url}`);
            }
          });
        }
      }
    }
  }
}

searchDir('c:/Users/Николай/Desktop/BAZZAR PROD/pixel');
