const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== DB Inbounds ==="
    sqlite3 /etc/x-ui/x-ui.db "SELECT stream_settings FROM inbounds LIMIT 1;"
    echo "=== iptables ==="
    iptables -t mangle -L FORWARD -n
    echo "=== X-UI Status ==="
    systemctl status x-ui --no-pager | head -n 5
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
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
}).on('error', (err) => {
  console.error('SSH connection error:', err);
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
