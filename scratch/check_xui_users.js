const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    cd /root/veil-vpn-bot/tg-bot
    node -e "
      import('dotenv').then(dotenv => {
        dotenv.config();
        const axios = require('axios');
        async function check() {
          try {
            const login = await axios.post('http://127.0.0.1:2053/api/login', {
              username: process.env.XUI_USERNAME || 'admin',
              password: process.env.XUI_PASSWORD || 'admin'
            });
            const cookie = login.headers['set-cookie'];
            const res = await axios.get('http://127.0.0.1:2053/api/inbounds/list', { headers: { Cookie: cookie } });
            const inbounds = res.data.obj;
            for (let inbound of inbounds) {
              const settings = JSON.parse(inbound.settings);
              const clients = settings.clients;
              const uuids = clients.map(c => c.id);
              console.log('Inbound', inbound.port, 'has', uuids.length, 'clients.');
              console.log('Includes d3f3e24b-c5ff-468c-adf2-04d897391dcd?', uuids.includes('d3f3e24b-c5ff-468c-adf2-04d897391dcd'));
              console.log('Clients:', uuids);
            }
          } catch(e) { console.error(e.message); }
        }
        check();
      });
    "
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
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
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
