const fs = require('fs');
const path = require('path');
const os = require('os');

function check() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const p = path.join(appData, 'higgsfield', 'credentials.json');
  console.log('Checking Roaming path:', p);
  if (fs.existsSync(p)) {
    console.log('FOUND! Content:');
    console.log(fs.readFileSync(p, 'utf8'));
  } else {
    console.log('Not found at Roaming path!');
  }
}

check();
