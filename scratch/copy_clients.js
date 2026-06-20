const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    cd /tmp
    sqlite3 /etc/x-ui/x-ui.db "SELECT settings FROM inbounds WHERE id=1" -json > in1.json
    node -e "
      const fs = require('fs');
      const in1 = JSON.parse(fs.readFileSync('in1.json', 'utf8'))[0];
      const settings = JSON.parse(in1.settings);
      
      const sql = \\\`UPDATE inbounds SET settings = '\\\${JSON.stringify(settings)}' WHERE id=2;\\\`;
      fs.writeFileSync('update2.sql', sql);
    "
    sqlite3 /etc/x-ui/x-ui.db < update2.sql
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
