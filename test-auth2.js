const { execSync } = require('child_process');
const fs = require('fs');

fs.mkdirSync('./tmp-home/.config/higgsfield', { recursive: true });
fs.writeFileSync('./tmp-home/.config/higgsfield/auth.json', JSON.stringify({ access_token: "fake" }));

try {
  execSync('node ./node_modules/@higgsfield/cli/bin/higgsfield.js account status --json', {
    env: { ...process.env, HOME: process.cwd() + '/tmp-home', XDG_CONFIG_HOME: process.cwd() + '/tmp-home' }
  });
} catch(e) {
  console.log('Error output:', e.stderr.toString() || e.stdout.toString());
}
