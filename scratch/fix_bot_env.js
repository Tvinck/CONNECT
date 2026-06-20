const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "Updating .env manually..."
    cat /root/veil-vpn-bot/tg-bot/.env | grep TELEGRAM_BOT_TOKEN
    
    # Let's just create a new .env for safety and add the token.
    sed -i '/TELEGRAM_BOT_TOKEN/d' /root/veil-vpn-bot/tg-bot/.env
    echo "TELEGRAM_BOT_TOKEN=8686965215:AAEDPCzkH9yifiYMoRwHiUe_EvGpWVL8L5U" >> /root/veil-vpn-bot/tg-bot/.env
    
    pm2 restart veil-bot
    sleep 3
    pm2 logs veil-bot --lines 15 --nostream
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
