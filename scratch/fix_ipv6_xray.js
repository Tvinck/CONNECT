const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    apt-get update && apt-get install -y jq
    
    cp /usr/local/x-ui/bin/config.json /usr/local/x-ui/bin/config.json.bak
    
    jq '.outbounds[0].settings.domainStrategy = "UseIPv4" | .routing.domainStrategy = "IPIfNonMatch"' /usr/local/x-ui/bin/config.json > /tmp/config.json
    mv /tmp/config.json /usr/local/x-ui/bin/config.json
    
    systemctl restart x-ui
    systemctl status x-ui --no-pager
    
    echo "=== Xray Logs after restart ==="
    sleep 2
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
