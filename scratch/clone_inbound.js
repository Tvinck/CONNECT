const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    cd /tmp
    sqlite3 /etc/x-ui/x-ui.db "SELECT * FROM inbounds WHERE id=1" -json > inbound1.json
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('inbound1.json', 'utf8'))[0];
      
      const streamSettings = JSON.parse(data.stream_settings);
      
      // Modify for GRPC
      streamSettings.network = 'grpc';
      delete streamSettings.tcpSettings;
      streamSettings.grpcSettings = { serviceName: 'grpc' };
      
      streamSettings.realitySettings.target = 'github.com:443';
      streamSettings.realitySettings.serverNames = ['github.com', 'www.github.com'];
      
      data.id = 2; // Assume id 2 is free
      data.port = 444;
      data.remark = 'VLESS-GRPC';
      data.tag = 'in-444-grpc';
      data.stream_settings = JSON.stringify(streamSettings);
      
      // Empty clients so bazzar-sync can populate it freshly!
      const settings = JSON.parse(data.settings);
      settings.clients = [];
      data.settings = JSON.stringify(settings);
      
      // generate SQL insert
      const sql = \\\`INSERT OR IGNORE INTO inbounds (id, user_id, up, down, total, remark, enable, expiry_time, listen, port, protocol, settings, stream_settings, tag, sniffing) VALUES (2, \\\${data.user_id}, 0, 0, 0, '\\\${data.remark}', 1, 0, '', 444, 'vless', '\\\${data.settings}', '\\\${data.stream_settings}', '\\\${data.tag}', '\\\${data.sniffing}');\\\`;
      fs.writeFileSync('insert.sql', sql);
    "
    sqlite3 /etc/x-ui/x-ui.db < insert.sql
    systemctl restart x-ui
    echo "Done"
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
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
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
