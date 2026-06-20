const https = require('https');

const url = 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6670559487';

const options = {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  timeout: 5000
};

https.get(url, options, (res) => {
  console.log('Status code:', res.statusCode);
  if (res.headers.location) {
    console.log('Redirect:', res.headers.location);
  }
}).on('error', (err) => {
  console.error('Error:', err.message);
});
