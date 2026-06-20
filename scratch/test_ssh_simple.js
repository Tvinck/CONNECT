const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH Connection succeeded!');
  conn.end();
}).on('error', (err) => {
  console.error('❌ SSH connection error:', err.message);
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
