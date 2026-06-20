const fs = require('fs');
const { Client } = require('ssh2');

const localPath = 'c:\\Users\\Николай\\Desktop\\BAZZAR PROD\\veil-vpn\\tg-bot\\bot.js';
const remotePath = '/root/veil-vpn-bot/tg-bot/bot.js';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // Read local file
    const content = fs.readFileSync(localPath, 'utf8');
    
    // Write to remote
    const stream = sftp.createWriteStream(remotePath);
    stream.on('close', () => {
      console.log('File uploaded successfully!');
      
      // Restart pm2
      conn.exec('pm2 restart veil-bot && sleep 2 && pm2 logs veil-bot --lines 10 --nostream', (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => {
          console.log('PM2 restarted.');
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });
    
    stream.write(content);
    stream.end();
  });
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
