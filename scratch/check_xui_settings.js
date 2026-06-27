const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  conn.exec("sqlite3 /etc/x-ui/x-ui.db \"SELECT key, value FROM settings;\"", (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('--- X-UI SETTINGS ---');
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
