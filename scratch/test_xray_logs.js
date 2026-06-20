const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `xray api statsquery --server=127.0.0.1:10085 || systemctl status xray --no-pager || cat /var/log/xray/error.log | tail -n 20`;
  
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
