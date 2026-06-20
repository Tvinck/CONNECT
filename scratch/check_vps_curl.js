const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    echo "=== VK ==="
    curl -I -s --connect-timeout 5 https://vk.com | head -n 5
    echo "=== OK.ru ==="
    curl -I -s --connect-timeout 5 https://ok.ru | head -n 5
    echo "=== Max (HBO) ==="
    curl -I -s --connect-timeout 5 https://www.max.com | head -n 5
    echo "=== Ozon ==="
    curl -I -s --connect-timeout 5 https://www.ozon.ru | head -n 5
    echo "=== Wildberries ==="
    curl -I -s --connect-timeout 5 https://www.wildberries.ru | head -n 5
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
