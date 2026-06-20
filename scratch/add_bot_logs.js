const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    sed -i "s/bot.start(async (ctx) => {/bot.start(async (ctx) => { console.log('✅ START TRIGGERED BY:', ctx.from.username || ctx.from.id);/g" /root/veil-vpn-bot/tg-bot/bot.js
    sed -i "s/bot.on('message', async (ctx) => {/bot.on('message', async (ctx) => { console.log('✅ MESSAGE RECEIVED:', ctx.message?.text, 'FROM:', ctx.from.username || ctx.from.id);/g" /root/veil-vpn-bot/tg-bot/bot.js
    pm2 restart veil-bot
    sleep 2
    pm2 logs veil-bot --lines 20 --nostream
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
