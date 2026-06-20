const https = require('https');

const token = 'ca3b90ebefed4d8a93789659263d4e2e';
const url = `https://www.veil-vps.online/api/sub?token=${token}`;

console.log(`Fetching: ${url}`);

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const decoded = Buffer.from(data, 'base64').toString('utf8');
        console.log('=== Decoded Sub Content ===');
        console.log(decoded);
      } catch (err) {
        console.error('Failed to decode Base64:', err.message);
        console.log(data);
      }
    } else {
      console.log('Response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
