const fs = require('fs');
const path = require('path');
const os = require('os');

function check() {
  const userHome = os.homedir();
  const paths = [
    path.join(userHome, '.config', 'higgsfield', 'credentials.json'),
    path.join(userHome, 'AppData', 'Local', 'higgsfield', 'credentials.json'),
    path.join(userHome, '.higgsfield', 'credentials.json')
  ];

  console.log('Checking local credentials paths...');
  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log(`FOUND at ${p}:`);
      console.log(fs.readFileSync(p, 'utf8'));
    } else {
      console.log(`Not found at ${p}`);
    }
  }
}

check();
