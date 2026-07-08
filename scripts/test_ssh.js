const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const script = `
    systemctl restart x-ui
    sleep 3
    python3 -c "import json; config = json.load(open('/usr/local/x-ui/bin/config.json')); print(json.dumps(config.get('inbounds', []), indent=2))"
  `;
  conn.exec(script, (err, stream) => {
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
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});











