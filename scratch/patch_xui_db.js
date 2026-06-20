const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    apt-get install -y sqlite3 jq
    
    # Extract current template
    sqlite3 /etc/x-ui/x-ui.db "SELECT value FROM settings WHERE key='xrayTemplateConfig';" > /tmp/template.json
    
    # Patch template
    jq '.outbounds[0].settings.domainStrategy = "UseIPv4" | .routing.domainStrategy = "IPIfNonMatch"' /tmp/template.json > /tmp/template_patched.json
    
    # Update SQLite
    # We must escape single quotes for sqlite3 shell
    ESCAPED_JSON=$(cat /tmp/template_patched.json | sed "s/'/''/g")
    sqlite3 /etc/x-ui/x-ui.db "UPDATE settings SET value='\$ESCAPED_JSON' WHERE key='xrayTemplateConfig';"
    
    echo "=== SQLite Updated ==="
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
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
