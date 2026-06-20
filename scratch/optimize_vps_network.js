const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    echo "=== 1. Checking X-UI / Xray status ==="
    systemctl status x-ui --no-pager || true
    
    echo "=== 2. Setting Network Optimizations (BBR) ==="
    cat <<EOF > /etc/sysctl.d/99-bbr.conf
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
net.ipv4.ip_forward=1
net.ipv4.tcp_rmem=4096 87380 16777216
net.ipv4.tcp_wmem=4096 65536 16777216
net.core.rmem_max=16777216
net.core.wmem_max=16777216
net.ipv4.tcp_fastopen=3
EOF
    sysctl --system
    
    echo "=== 3. Checking Listening Ports ==="
    netstat -tuln | grep -E ":443 |:80 |:36537 " || ss -tuln | grep -E ":443 |:80 |:36537 "
    
    echo "=== 4. Recent X-UI/Xray logs ==="
    journalctl -u x-ui --no-pager -n 20
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
