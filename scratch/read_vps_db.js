const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    if [ -f /etc/x-ui/x-ui.db ]; then
      echo "Found DB at /etc/x-ui/x-ui.db"
      sqlite3 /etc/x-ui/x-ui.db "SELECT id, protocol, port, stream_settings FROM inbounds"
    elif [ -f /usr/local/x-ui/bin/x-ui.db ]; then
      echo "Found DB at /usr/local/x-ui/bin/x-ui.db"
      sqlite3 /usr/local/x-ui/bin/x-ui.db "SELECT id, protocol, port, stream_settings FROM inbounds"
    else
      echo "x-ui.db not found in standard paths"
      find / -name "x-ui.db" 2>/dev/null
    fi
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
