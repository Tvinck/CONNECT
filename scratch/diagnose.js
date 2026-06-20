const { Client } = require('ssh2');
const https = require('https');
const conn = new Client();

// 1. Check API Subscription Link
const apiUrl = 'https://www.veil-vps.online/api/sub?token=719491ae32b144029d61c136a4155dc5';
console.log('=== Checking API ===');
https.get(apiUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`API Status: ${res.statusCode}`);
    console.log(`API Response (first 200 chars): ${data.substring(0, 200)}`);
  });
}).on('error', err => {
  console.log('API Error:', err.message);
});

// 2. Check VPS Bot Logs
conn.on('ready', () => {
  console.log('\n=== Checking VPS PM2 Logs ===');
  const cmd = `pm2 logs veil-bot --lines 30 --nostream`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
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
