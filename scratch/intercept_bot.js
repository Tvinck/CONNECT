const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    pm2 stop veil-bot
    sleep 2
    node -e "
      const https = require('https');
      https.get('https://api.telegram.org/bot8686965215:AAEDPCzkH9yifiYMoRwHiUe_EvGpWVL8L5U/getUpdates?timeout=5', res => {
        let d = '';
        res.on('data', c => d+=c);
        res.on('end', () => {
          console.log('UPDATES:', d);
        });
      });
    "
    pm2 start veil-bot
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
