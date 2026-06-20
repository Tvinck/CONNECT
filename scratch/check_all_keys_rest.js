const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    cd /root/veil-vpn-bot/tg-bot
    node -e "
      import('dotenv').then(dotenv => {
        dotenv.config();
        const url = process.env.VITE_SUPABASE_URL + '/rest/v1/vpn_subscriptions?select=token,subscription_key';
        const key = process.env.VITE_SUPABASE_ANON_KEY;
        fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } })
          .then(r => r.json())
          .then(data => console.log(JSON.stringify(data, null, 2)))
          .catch(err => console.error(err));
      });
    "
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
