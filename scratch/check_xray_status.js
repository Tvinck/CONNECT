const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    echo "=== 1. Checking x-ui systemd service ==="
    systemctl status x-ui
    
    echo "=== 2. Checking xray process status ==="
    pgrep -fl xray
    
    echo "=== 3. Checking last 50 lines of x-ui/xray systemd log ==="
    journalctl -u x-ui -n 50 --no-pager
    
    echo "=== 4. Checking xray config file ==="
    if [ -f /usr/local/x-ui/bin/config.json ]; then
      cat /usr/local/x-ui/bin/config.json
    else
      echo "config.json not found"
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
