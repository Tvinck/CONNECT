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
      async function updateSNI() {
        try {
          const homeRes = await api.get('');
          const html = typeof homeRes.data === 'string' ? homeRes.data : '';
          const csrfMatch = html.match(/name=\\"csrf-token\\"\\s+content=\\"([^\\"]+)\\"/);
          const csrfToken = csrfMatch ? csrfMatch[1] : '';
          const sessionCookie = homeRes.headers['set-cookie'][0].split(';')[0];
          
          const login = await api.post('login', {
            username: 'Uvt5i4YUGZ',
            password: 'ffeYdCd65h'
          }, {
            headers: {
              'X-Csrf-Token': csrfToken,
              'Cookie': sessionCookie
            }
          });
          
          if(!login.data.success) return console.log('Login failed', login.data);
          
          const authCookie = login.headers['set-cookie'][0].split(';')[0];
          api.defaults.headers.common['Cookie'] = authCookie;
          api.defaults.headers.common['X-Csrf-Token'] = csrfToken;
          
          const res = await api.get('panel/api/inbounds/list');
          const inbounds = res.data.obj;
          const vless = inbounds.find(i => i.protocol === 'vless');
          
          if (!vless) return console.log('VLESS inbound not found');
          
          const streamSettings = JSON.parse(vless.streamSettings);
          streamSettings.realitySettings.target = 'www.microsoft.com:443';
          streamSettings.realitySettings.serverNames = ['www.microsoft.com'];
          
          vless.streamSettings = JSON.stringify(streamSettings);
          
          const updateRes = await api.post('panel/api/inbounds/update/' + vless.id, vless);
          console.log('Update res:', updateRes.data);
          
        } catch(e) { console.error(e.response ? e.response.status : e.message); }
      }
      updateSNI();
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
