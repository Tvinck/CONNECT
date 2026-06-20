const { Client } = require('ssh2');
const https = require('https');
const conn = new Client();

// 1. Update VPS Env and Restart Bot
conn.on('ready', () => {
  console.log('=== Updating VPS Bot Token ===');
  const cmd = `
    sed -i 's/^TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=8686965215:AAEDPCzkH9yifiYMoRwHiUe_EvGpWVL8L5U/' /root/veil-vpn-bot/tg-bot/.env
    pm2 restart veil-bot
    sleep 2
    pm2 logs veil-bot --lines 10 --nostream
  `;
  
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
      
      // 2. Test API after VPS update
      testAPI();
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

function testAPI() {
  console.log('\n=== Checking API Output ===');
  const apiUrl = 'https://www.veil-vps.online/api/sub?token=719491ae32b144029d61c136a4155dc5';
  https.get(apiUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`API Status: ${res.statusCode}`);
      const decoded = Buffer.from(data, 'base64').toString('utf-8');
      console.log(`Decoded Content:\n${decoded}`);
    });
  }).on('error', err => {
    console.log('API Error:', err.message);
  });
}
