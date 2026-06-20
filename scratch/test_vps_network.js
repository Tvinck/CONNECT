const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== Testing curl to Instagram ==="
    curl -4 -Iv -m 5 https://instagram.com || echo "Curl to Instagram failed"
    
    echo "=== Testing curl to ChatGPT ==="
    curl -4 -Iv -m 5 https://chatgpt.com || echo "Curl to ChatGPT failed"
    
    echo "=== Testing DNS resolution ==="
    time nslookup instagram.com
    
    echo "=== Checking Xray DNS Config ==="
    jq '.dns' /usr/local/x-ui/bin/config.json
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
