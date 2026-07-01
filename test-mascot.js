const https = require('https');

https.get('https://connect-4va6.vercel.app/mascot.png', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
}).on('error', (e) => {
  console.error(e);
});
