const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    echo "=== CPU & Memory Load ==="
    uptime
    free -h
    
    echo "=== CPU Usage ==="
    mpstat 1 3 || top -b -n 1 | head -n 20
    
    echo "=== Network Connections Count ==="
    ss -s
    
    echo "=== Top process resource usage ==="
    ps -eo pcpu,pmem,args --sort=-pcpu | head -15
    
    echo "=== Bandwidth / network interfaces ==="
    ip -s link
    
    echo "=== Active Xray connection ports and listening ==="
    ss -tlnp | grep -E "xray|x-ui"
    
    echo "=== Checking ping latency to Google DNS ==="
    ping -c 4 8.8.8.8
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
