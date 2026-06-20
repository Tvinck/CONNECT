const https = require('https');

const apiKey = '372a1c75d983024c4634dc6b64d238d4f4251c6455b42ad7f1935d2f47ef275f';

function testApi(authHeaderValue) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'seller.ggsel.com',
      path: '/api_sellers/api/sellers/account/balance/info',
      method: 'GET',
      headers: {
        'Authorization': authHeaderValue,
        'Accept': 'application/json'
      },
      timeout: 5000
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          authHeader: authHeaderValue,
          status: res.statusCode,
          body: data
        });
      });
    }).on('error', (err) => {
      resolve({
        authHeader: authHeaderValue,
        status: 'ERROR',
        error: err.message
      });
    });
  });
}

async function run() {
  console.log('Testing GGsel API key with different auth headers...');
  
  // Test 1: Plain key
  const r1 = await testApi(apiKey);
  console.log(`Test 1 (Plain Key) -> Status: ${r1.status}`);
  console.log(`Body: ${r1.body}\n`);

  // Test 2: Bearer key
  const r2 = await testApi(`Bearer ${apiKey}`);
  console.log(`Test 2 (Bearer Key) -> Status: ${r2.status}`);
  console.log(`Body: ${r2.body}\n`);

  // Test 3: api_key query parameter (sometimes Digiseller/GGsel uses query auth)
  // Let's check that too
}

run();
