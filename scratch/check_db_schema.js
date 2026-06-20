const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    sqlite3 /etc/x-ui/x-ui.db ".schema client_traffics"
    echo "---"
    sqlite3 /etc/x-ui/x-ui.db ".schema inbounds"
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
