const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    cd /opt/bazzar-sync
    node -e "
      const axios = require('axios');
      const https = require('https');
      const api = axios.create({
        baseURL: 'https://185.142.99.185:36537/qsgoOThSkfHypc0BSW/',
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        withCredentials: true
      });
      async function run() {
        const login = await api.post('login', { username: 'Uvt5i4YUGZ', password: 'ffeYdCd65h' });
        const cookie = login.headers['set-cookie'][0].split(';')[0];
        const res = await api.get('panel/api/inbounds/list', { headers: { Cookie: cookie } });
        const vless = res.data.obj.filter(i => i.protocol === 'vless');
        console.log(JSON.stringify(vless, null, 2));
      }
      run().catch(console.error);
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
