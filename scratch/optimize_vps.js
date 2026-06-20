const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established for VPS network and speed optimization.');
  
  const cmd = `
    echo "=== 1. Backup and update x-ui systemd service file ==="
    cat << 'EOF' > /etc/systemd/system/x-ui.service
[Unit]
Description=x-ui Service
After=network.target
Wants=network.target

[Service]
EnvironmentFile=-/etc/default/x-ui
Environment="XRAY_VMESS_AEAD_FORCED=false"
Type=simple
WorkingDirectory=/usr/local/x-ui/
ExecStart=/usr/local/x-ui/x-ui
ExecReload=kill -USR1 $MAINPID
Restart=on-failure
RestartSec=5s
LimitNOFILE=1000000
LimitNPROC=1000000

[Install]
WantedBy=multi-user.target
EOF

    echo "=== 2. Add TCP network optimizations to /etc/sysctl.conf ==="
    # Backup sysctl
    cp /etc/sysctl.conf /etc/sysctl.conf.bak
    
    # Remove any existing tuned parameters to avoid duplicates
    sed -i '/net.core.netdev_max_backlog/d' /etc/sysctl.conf
    sed -i '/net.core.somaxconn/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_max_syn_backlog/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_fastopen/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_slow_start_after_idle/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_tw_reuse/d' /etc/sysctl.conf
    
    # Append optimized network stack configuration
    cat << 'EOF' >> /etc/sysctl.conf
net.core.netdev_max_backlog = 100000
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 32768
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_tw_reuse = 1
EOF

    echo "=== 3. Apply sysctl parameters ==="
    sysctl -p
    
    echo "=== 4. Reload systemd daemon and restart x-ui ==="
    systemctl daemon-reload
    systemctl restart x-ui
    
    echo "=== 5. Verification ==="
    # Find xray process inside x-ui group and display its limits
    XRAY_PID=$(pgrep xray)
    if [ ! -z "$XRAY_PID" ]; then
      echo "Xray PID found: $XRAY_PID"
      cat /proc/$XRAY_PID/limits | grep -E "Max open files|Max processes"
    else
      echo "Xray process not found, checking x-ui process limits:"
      XUI_PID=$(pgrep x-ui)
      if [ ! -z "$XUI_PID" ]; then
        cat /proc/$XUI_PID/limits | grep -E "Max open files|Max processes"
      else
        echo "No process limits found"
      fi
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
