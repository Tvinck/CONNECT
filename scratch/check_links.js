const https = require('https');

const links = [
  { name: 'Windows - Hiddify (Happ)', url: 'https://github.com/hiddify/hiddify-next/releases/latest/download/Hiddify-Windows-Setup-x64.exe' },
  { name: 'Windows - FlClash', url: 'https://github.com/chen08209/FlClash/releases/latest/download/FlClash-Windows-x64-Setup.exe' },
  { name: 'macOS - Hiddify (Happ)', url: 'https://github.com/hiddify/hiddify-next/releases/latest' },
  { name: 'macOS - FlClash', url: 'https://github.com/chen08209/FlClash/releases/latest' },
  { name: 'iOS - Hiddify (Happ)', url: 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6598772702' },
  { name: 'iOS - Stash', url: 'https://apps.apple.com/us/app/stash/id1596063349' },
  { name: 'iOS - Shadowrocket', url: 'https://apps.apple.com/us/app/shadowrocket/id932747118' },
  { name: 'iOS - Streisand', url: 'https://apps.apple.com/us/app/streisand/id6450534064' },
  { name: 'Android - Hiddify (Happ)', url: 'https://play.google.com/store/apps/details?id=app.hiddify.com' },
  { name: 'Android - FlClash', url: 'https://github.com/chen08209/FlClash/releases/latest/download/FlClash-Android-arm64-v8a.apk' },
  { name: 'Android - Clash Meta', url: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases/latest' },
  { name: 'Android - v2rayNG', url: 'https://play.google.com/store/apps/details?id=com.v2ray.ang' },
  { name: 'Linux - Hiddify (Happ)', url: 'https://github.com/hiddify/hiddify-next/releases/latest/download/Hiddify-Linux-x64.AppImage' },
  { name: 'Android TV - Hiddify (Happ)', url: 'https://play.google.com/store/apps/details?id=app.hiddify.com' },
  { name: 'Apple TV - Hiddify (Happ)', url: 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6598772702' },
  { name: 'Apple TV - Shadowrocket', url: 'https://apps.apple.com/us/app/shadowrocket/id932747118' },
  { name: 'Apple TV - Stash', url: 'https://apps.apple.com/us/app/stash/id1596063349' }
];

function checkUrl(item) {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000
    };

    const req = https.get(item.url, options, (res) => {
      resolve({
        name: item.name,
        url: item.url,
        status: res.statusCode,
        location: res.headers.location || null
      });
    });

    req.on('error', (err) => {
      resolve({
        name: item.name,
        url: item.url,
        status: 'ERROR',
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: item.name,
        url: item.url,
        status: 'TIMEOUT'
      });
    });
  });
}

async function run() {
  console.log('Starting URL verification...');
  const results = [];
  for (const item of links) {
    const res = await checkUrl(item);
    console.log(`[${res.status}] ${res.name} -> ${res.url}`);
    if (res.location) {
      console.log(`      Redirect: -> ${res.location}`);
    }
    if (res.error) {
      console.log(`      Error: ${res.error}`);
    }
    results.push(res);
  }
  
  console.log('\n--- VERIFICATION SUMMARY ---');
  const broken = results.filter(r => r.status === 404 || r.status === 'ERROR');
  if (broken.length === 0) {
    console.log('All links are valid and active (returning 2xx/3xx status)!');
  } else {
    console.log(`${broken.length} link(s) might be broken:`);
    broken.forEach(b => console.log(`- ${b.name}: ${b.url} (Status: ${b.status})`));
  }
}

run();
