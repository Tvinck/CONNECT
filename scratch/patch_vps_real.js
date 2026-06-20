const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== Patching DB Inbounds ==="
    # Use REPLACE for gateway.icloud.com -> yahoo.com
    sqlite3 /etc/x-ui/x-ui.db "UPDATE inbounds SET stream_settings = REPLACE(stream_settings, 'gateway.icloud.com', 'yahoo.com');"
    sqlite3 /etc/x-ui/x-ui.db "UPDATE inbounds SET stream_settings = REPLACE(stream_settings, 'www.intel.com', 'yahoo.com');"

    echo "=== Patching Xray Template ==="
    # Extract template
    sqlite3 /etc/x-ui/x-ui.db "SELECT value FROM settings WHERE key='xrayTemplateConfig';" > /tmp/template.json
    
    # Check if template is valid JSON, add DNS, use jq
    if jq -e . /tmp/template.json >/dev/null 2>&1; then
      jq '.dns = { "servers": [ "1.1.1.1", "8.8.8.8", "localhost" ] }' /tmp/template.json > /tmp/template_patched.json
      ESCAPED_JSON=$(cat /tmp/template_patched.json | sed "s/'/''/g")
      sqlite3 /etc/x-ui/x-ui.db "UPDATE settings SET value='\$ESCAPED_JSON' WHERE key='xrayTemplateConfig';"
      echo "Template Patched!"
    else
      echo "Failed to parse template JSON"
    fi

    echo "=== Apply iptables TCP MSS Clamping ==="
    iptables -t mangle -D FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || true
    iptables -t mangle -I FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
    
    echo "=== Saving iptables ==="
    iptables-save > /etc/iptables/rules.v4
    netfilter-persistent save

    echo "=== Restart X-UI ==="
    systemctl restart x-ui
    sleep 2
    systemctl status x-ui --no-pager | head -n 5
    
    echo "=== Verification ==="
    sqlite3 /etc/x-ui/x-ui.db "SELECT stream_settings FROM inbounds LIMIT 1;"
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
