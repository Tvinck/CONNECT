const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    cd /root/veil-vpn-bot/tg-bot
    node -e "
      import('dotenv').then(dotenv => {
        dotenv.config();
        import('@supabase/supabase-js').then(({ createClient }) => {
          const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
          supabase.from('vpn_subscriptions').select('token, subscription_key').then(({ data }) => {
            console.log('ALL KEYS:', JSON.stringify(data, null, 2));
          });
        });
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
