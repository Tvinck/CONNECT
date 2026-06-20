const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== iptables mangle rules ==="
    iptables -t mangle -L FORWARD -v -n
    
    echo "=== WARP status ==="
    warp-cli --version || echo "WARP not installed"
    
    echo "=== X-UI Template ==="
    sqlite3 /etc/x-ui/x-ui.db "SELECT value FROM settings WHERE key='xrayTemplateConfig';"
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
