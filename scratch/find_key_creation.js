const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\Николай\\Desktop\\BAZZAR PROD\\connect',
  'c:\\Users\\Николай\\Desktop\\BAZZAR PROD\\veil-vpn'
];

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('subscription_key') && (content.includes('vless://') || content.includes('insert') || content.includes('update'))) {
      // Print lines where it is assigned or used
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('subscription_key') && (line.includes('=') || line.includes(':') || line.includes('vless'))) {
          console.log(`File: ${filePath} (line ${idx + 1}): ${line.trim()}`);
        }
      });
    }
  } catch (err) {}
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.next' || file === 'dist' || file === 'scratch') {
      return;
    }
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath);
    } else {
      searchFile(fullPath);
    }
  });
}

dirs.forEach(dir => {
  walk(dir);
});
console.log('Search completed.');
