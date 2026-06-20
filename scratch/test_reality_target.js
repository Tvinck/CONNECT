const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== Ping gateway.icloud.com ==="
    ping -c 3 gateway.icloud.com
    
    echo "=== Curl gateway.icloud.com ==="
    curl -Iv --connect-timeout 5 https://gateway.icloud.com
    
    echo "=== Curl www.intel.com ==="
    curl -Iv --connect-timeout 5 https://www.intel.com
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
