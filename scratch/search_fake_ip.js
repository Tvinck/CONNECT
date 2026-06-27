const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.git_backup' && file !== '.next') {
        search(fullPath);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('fake-ip')) {
          console.log(`Found 'fake-ip' reference in: ${fullPath}`);
        }
      }
    }
  }
}

search('c:/Users/Николай/Desktop/BAZZAR PROD');
