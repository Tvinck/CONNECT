const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    sqlite3 /etc/x-ui/x-ui.db "SELECT name FROM sqlite_master WHERE type='table'"
    echo "=== Settings Table Content ==="
    sqlite3 /etc/x-ui/x-ui.db "SELECT * FROM settings"
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log('Result from VPS:');
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
