const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    # Try running xray x25519 to verify public key
    if [ -f /usr/local/x-ui/bin/xray-linux-amd64 ]; then
      /usr/local/x-ui/bin/xray-linux-amd64 x25519 -i "uHiiRKqSaiVBGECefqAXzhNVG7qwxWf5RdaBkdtFOUs"
    elif [ -f /usr/local/bin/xray ]; then
      /usr/local/bin/xray x25519 -i "uHiiRKqSaiVBGECefqAXzhNVG7qwxWf5RdaBkdtFOUs"
    else
      echo "xray binary not found in standard paths"
    fi
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
