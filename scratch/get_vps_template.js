const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  conn.exec("sqlite3 /etc/x-ui/x-ui.db \"SELECT value FROM settings WHERE key='xrayTemplateConfig';\"", (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('--- CURRENT XRAY TEMPLATE CONFIG ---');
      try {
        console.log(JSON.stringify(JSON.parse(out), null, 2));
      } catch (e) {
        console.log('Raw output:', out);
      }
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
