const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection successful.');
  
  const cmd = `
    echo "=== SYSTEM RESOURCE USAGE ==="
    uptime
    echo ""
    free -h
    echo ""
    df -h /
    echo ""
    
    echo "=== PM2 STATUS ==="
    pm2 status
    echo ""
    
    echo "=== SYSTEMD SERVICES STATUS ==="
    systemctl list-units --type=service --state=running | grep -E "x-ui|xray|pm2|pixel|bazzar|veil|nginx" || echo "No custom services"
    echo ""
    
    echo "=== NETWORK LISTENING PORTS ==="
    ss -tlnp
    echo ""
    
    echo "=== PROCESSES LIST ==="
    ps aux | grep -E "node|python|xray|x-ui|pixel|bazzar" | grep -v grep
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log('VPS Status Output:');
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
