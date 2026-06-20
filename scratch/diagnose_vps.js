const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established for diagnostics.');
  
  const cmd = `
    echo "=== CPU INFO ==="
    lscpu | grep -E "Model name|Core\\(s\\) per socket|CPU\\(s\\):"
    
    echo "\n=== MEMORY INFO ==="
    free -m
    
    echo "\n=== SYSTEM LIMITS ==="
    ulimit -n
    cat /etc/security/limits.conf | grep -v "^#" | grep -v "^$" || echo "No custom limits"
    
    echo "\n=== TCP SYSCTL PARAMETERS ==="
    sysctl net.ipv4.tcp_wmem
    sysctl net.ipv4.tcp_rmem
    sysctl net.core.rmem_max
    sysctl net.core.wmem_max
    sysctl net.core.netdev_max_backlog
    sysctl net.ipv4.tcp_max_syn_backlog
    sysctl net.ipv4.tcp_tw_reuse
    
    echo "\n=== X-UI / XRAY SERVICE STATUS ==="
    systemctl status xray --no-pager | head -n 15 || echo "xray status failed"
    systemctl status x-ui --no-pager | head -n 15 || echo "x-ui status failed"
    
    echo "\n=== NETWORK BENCHMARK (Download 10MB test file) ==="
    curl -o /dev/null -s -w 'Speed: %{speed_download} B/s\nTime: %{time_total}s\n' https://speed.hetzner.de/10MB.bin
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
