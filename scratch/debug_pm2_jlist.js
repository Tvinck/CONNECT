const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  conn.exec('pm2 jlist', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('--- RAW PM2 JLIST OUTPUT ---');
      console.log(JSON.stringify(out));
      console.log('--- PRINTED ---');
      console.log(out);
      conn.end();
    }).on('data', (data) => {
      out += data;
    });
  });
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
