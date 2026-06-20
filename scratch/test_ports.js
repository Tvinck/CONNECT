const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    echo "=== 1. Testing TCP (Port 443) fallback target ==="
    curl -Ivs --connect-timeout 5 --resolve www.microsoft.com:443:127.0.0.1 https://www.microsoft.com/ 2>&1 | grep -E "Server|HTTP/|HTTP_CONNECT" || true
    
    echo "\n=== 2. Testing gRPC (Port 444) fallback target ==="
    curl -Ivs --connect-timeout 5 --resolve github.com:444:127.0.0.1 https://github.com:444/ 2>&1 | grep -E "Server|HTTP/|HTTP_CONNECT" || true
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
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
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
