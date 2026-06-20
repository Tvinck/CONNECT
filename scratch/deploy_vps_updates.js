const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    cd /root/veil-vpn-bot
    echo "=== Current branch and status ==="
    git status
    
    echo "=== Pulling changes from GitHub ==="
    git reset --hard
    git pull
    
    echo "=== Checking tg-bot dependencies ==="
    cd tg-bot
    # Install if anything changed, although we didn't add dependencies
    pnpm install || npm install
    
    echo "=== Restarting PM2 processes ==="
    pm2 restart veil-bot
    pm2 restart veil-sync
    pm2 restart veil-monitor
    
    echo "=== PM2 Status ==="
    pm2 status
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log('Result from VPS deployment:');
      console.log(out);
      conn.end();
    }).on('data', (data) => {
      out += data;
    }).stderr.on('data', (data) => {
      out += data;
    });
  });
}).on('error', (err) => {
  console.error('SSH connection error:', err);
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
