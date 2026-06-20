const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localFile = 'c:\\\\Users\\\\Николай\\\\Desktop\\\\BAZZAR PROD\\\\veil-vpn\\\\tg-bot\\\\sync.js';
    const remoteFile = '/opt/bazzar-sync/sync.js';
    
    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) throw err;
      console.log('File uploaded successfully!');
      
      conn.exec('pm2 restart bazzar-sync && pm2 logs bazzar-sync --lines 10 --nostream', (err, stream) => {
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
    });
  });
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
