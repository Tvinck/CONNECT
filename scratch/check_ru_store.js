const https = require('https');

const urls = [
  { name: 'iOS Hiddify (RU)', url: 'https://apps.apple.com/ru/app/hiddify-proxy-vpn/id6598772702' },
  { name: 'iOS Stash (RU)', url: 'https://apps.apple.com/ru/app/stash/id1596063349' },
  { name: 'iOS Shadowrocket (RU)', url: 'https://apps.apple.com/ru/app/shadowrocket/id932747118' },
  { name: 'iOS Streisand (RU)', url: 'https://apps.apple.com/ru/app/streisand/id6450534064' }
];

const options = {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  timeout: 5000
};

async function test() {
  for (const item of urls) {
    await new Promise((resolve) => {
      https.get(item.url, options, (res) => {
        console.log(`${item.name}: Status ${res.statusCode}`);
        resolve();
      }).on('error', (err) => {
        console.log(`${item.name}: Error ${err.message}`);
        resolve();
      });
    });
  }
}

test();
