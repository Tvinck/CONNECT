const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established for verification.');
  
  const cmd = `
    XRAY_PID=$(pgrep xray)
    if [ ! -z "$XRAY_PID" ]; then
      echo "Xray PID: $XRAY_PID"
      cat /proc/$XRAY_PID/limits | grep -E "Max open files|Max processes"
    else
      echo "xray process not found"
    fi
    
    echo "Current sysctl congestion control:"
    sysctl net.ipv4.tcp_congestion_control
    sysctl net.core.netdev_max_backlog
    sysctl net.core.somaxconn
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
