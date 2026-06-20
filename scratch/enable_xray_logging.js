const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const pyScript = `
import json

path = '/usr/local/x-ui/bin/config.json'
with open(path, 'r', encoding='utf-8') as f:
    config = json.load(f)

config['log'] = {
    'access': '/var/log/xray/access.log',
    'error': '/var/log/xray/error.log',
    'loglevel': 'debug',
    'dnsLog': False,
    'maskAddress': ''
}

with open(path, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2)

print("LOGS_ENABLED_IN_CONFIG")
`;

  const cmd = `
    echo "=== 1. Create log folder and set permissions ==="
    mkdir -p /var/log/xray
    touch /var/log/xray/access.log /var/log/xray/error.log
    chmod -R 777 /var/log/xray
    
    echo "=== 2. Update xray config ==="
    cat << 'EOF' > /tmp/update_logs.py
${pyScript}
EOF
    python3 /tmp/update_logs.py
    rm /tmp/update_logs.py
    
    echo "=== 3. Restart x-ui ==="
    systemctl restart x-ui
    sleep 3
    
    echo "=== 4. Check if log files have content ==="
    ls -l /var/log/xray/
    echo "Error log tail:"
    tail -n 20 /var/log/xray/error.log
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
