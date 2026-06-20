const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established for SNI update.');
  
  const pyScript = `
import sqlite3
import json

db_path = '/etc/x-ui/x-ui.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT stream_settings FROM inbounds WHERE id = 1")
row = cursor.fetchone()
if row:
    settings = json.loads(row[0])
    reality = settings.get('realitySettings', {})
    
    # Update target and serverNames
    reality['target'] = 'gateway.icloud.com:443'
    reality['serverNames'] = ['gateway.icloud.com', 'www.intel.com']
    
    settings['realitySettings'] = reality
    updated_json = json.dumps(settings)
    
    cursor.execute("UPDATE inbounds SET stream_settings = ? WHERE id = 1", (updated_json,))
    conn.commit()
    print("DATABASE_UPDATED_SUCCESSFULLY")
else:
    print("INBOUND_NOT_FOUND")

conn.close()
`;

  // Escape single quotes for bash EOF
  const cmd = `
    cat << 'EOF' > /tmp/update_sni.py
${pyScript}
EOF
    python3 /tmp/update_sni.py
    rm /tmp/update_sni.py
    
    echo "=== Restarting x-ui service ==="
    systemctl restart x-ui
    
    echo "=== Verifying x-ui DB status ==="
    sqlite3 /etc/x-ui/x-ui.db "SELECT id, protocol, port, stream_settings FROM inbounds WHERE id = 1"
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
