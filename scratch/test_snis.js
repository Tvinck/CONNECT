const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    test_sni() {
      domain=$1
      echo "--- Testing SNI: $domain ---"
      # Check if domain supports TLS 1.3 and HTTP/2
      curl -Ivs --http2 https://$domain/ 2>&1 | grep -E "ALPN|SSL connection|HTTP/" | head -n 10
    }
    
    test_sni "www.samsung.com"
    test_sni "swscan.apple.com"
    test_sni "gateway.icloud.com"
    test_sni "dl.delivery.mp.microsoft.com"
    test_sni "www.intel.com"
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
