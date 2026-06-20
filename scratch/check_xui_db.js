const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `sqlite3 /etc/x-ui/x-ui.db "SELECT settings, stream_settings FROM inbounds WHERE port=443"`;
  
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
