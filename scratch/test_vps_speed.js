const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established.');
  
  const cmd = `
    echo "=== Checking speedtest tool ==="
    if command -v speedtest &> /dev/null; then
      speedtest --accept-license --accept-gdpr
    elif command -v speedtest-cli &> /dev/null; then
      speedtest-cli
    else
      echo "speedtest tools not found. Trying to download a test script or install speedtest-cli..."
      # Install speedtest-cli via apt
      apt-get update -y && apt-get install -y speedtest-cli
      speedtest-cli || wget -O - https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3
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
