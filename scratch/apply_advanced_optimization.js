const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established for Advanced Network Optimization.');
  
  const cmd = `
    echo "=== 1. Backup and update /etc/sysctl.conf with advanced TCP parameters ==="
    cp /etc/sysctl.conf /etc/sysctl.conf.advanced.bak
    
    # Remove existing properties to avoid duplicates
    sed -i '/net.ipv4.tcp_rmem/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_wmem/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_mtu_probing/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_max_orphans/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_keepalive/d' /etc/sysctl.conf
    sed -i '/net.core.default_qdisc/d' /etc/sysctl.conf
    
    # Append optimized TCP read/write buffer sizes and MTU probing
    cat << 'EOF' >> /etc/sysctl.conf
net.core.default_qdisc = fq
net.ipv4.tcp_rmem = 4096 87380 33554432
net.ipv4.tcp_wmem = 4096 65536 33554432
net.ipv4.tcp_mtu_probing = 1
net.ipv4.tcp_max_orphans = 262144
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_keepalive_probes = 5
EOF

    echo "=== 2. Load sch_fq module ==="
    modprobe sch_fq
    # Ensure it loads on boot
    if ! grep -q "sch_fq" /etc/modules 2>/dev/null; then
      echo "sch_fq" >> /etc/modules
    fi

    echo "=== 3. Apply sysctl parameters ==="
    sysctl -p
    
    echo "=== 4. Configure active interface eth0 to use fq ==="
    tc qdisc replace dev eth0 root fq
    
    echo "=== 5. Verification ==="
    echo "Current default_qdisc:"
    sysctl net.core.default_qdisc
    echo "Active qdisc on eth0:"
    tc qdisc show dev eth0
    echo "TCP buffers:"
    sysctl net.ipv4.tcp_rmem net.ipv4.tcp_wmem
    echo "MTU Probing:"
    sysctl net.ipv4.tcp_mtu_probing
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
