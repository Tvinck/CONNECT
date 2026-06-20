const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    node -e "
      const axios = require('axios');
      const https = require('https');
      const api = axios.create({ 
        baseURL: 'https://185.142.99.185:36537/qsgoOThSkfHypc0BSW/', 
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        withCredentials: true 
      });
      async function check() {
        try {
          const login = await api.post('login', {
            username: 'Uvt5i4YUGZ',
            password: 'ffeYdCd65h'
          });
          const cookie = login.headers['set-cookie'][0].split(';')[0];
          const res = await api.get('panel/api/inbounds/list', { headers: { Cookie: cookie } });
          const inbounds = res.data.obj;
          for (let inbound of inbounds) {
            if (inbound.protocol === 'vless') {
              const settings = JSON.parse(inbound.settings);
              const clients = settings.clients;
              const uuids = clients.map(c => c.id);
              console.log('Inbound', inbound.port, 'has', uuids.length, 'clients.');
              console.log('Includes d3f3e24b-c5ff-468c-adf2-04d897391dcd?', uuids.includes('d3f3e24b-c5ff-468c-adf2-04d897391dcd'));
              console.log('Includes a2511b13-8fb6-4198-87d4-2e619f072273?', uuids.includes('a2511b13-8fb6-4198-87d4-2e619f072273'));
              console.log('First 5 clients:', uuids.slice(0, 5));
            }
          }
        } catch(e) { console.error(e.message); }
      }
      check();
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
