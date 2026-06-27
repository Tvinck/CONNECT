const os = require('os');

// 1. Monkeypatch hostname to return ASCII only
os.hostname = () => 'BazzarPC';

// 2. Monkeypatch userInfo to return ASCII username
const originalUserInfo = os.userInfo;
os.userInfo = function(options) {
  try {
    const info = originalUserInfo.call(this, options);
    info.username = 'BazzarUser';
    return info;
  } catch (e) {
    return { username: 'BazzarUser', homedir: os.homedir(), shell: null };
  }
};

// 3. Override standard user environment variables
process.env.USER = 'BazzarUser';
process.env.USERNAME = 'BazzarUser';
process.env.LOGNAME = 'BazzarUser';

console.log('🚀 Launching Vercel deployment with ASCII environment patches...');
console.log(`  Hostname: ${os.hostname()}`);
console.log(`  Username: ${os.userInfo().username}`);

// 4. Use dynamic import() for the ES Module
import('../node_modules/vercel/dist/vc.js')
  .catch(err => {
    console.error('Failed to import Vercel CLI:', err);
  });
