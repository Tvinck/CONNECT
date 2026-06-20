const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\Николай\\Desktop\\BAZZAR PROD\\connect',
  'c:\\Users\\Николай\\Desktop\\BAZZAR PROD\\veil-vpn'
];

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('www.intel.com')) {
      console.log(`Found in: ${filePath}`);
    }
  } catch (err) {
    // ignore binary files/folders
  }
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
  console.log(`Searching directory: ${dir}`);
  walk(dir);
});
console.log('Search completed.');
