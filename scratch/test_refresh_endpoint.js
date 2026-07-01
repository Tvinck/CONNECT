// Test if Higgsfield has a refresh token endpoint
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const credsPath = path.join(os.homedir(), '.config', 'higgsfield', 'credentials.json');
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
console.log('refresh_token:', creds.refresh_token?.substring(0, 30) + '...');

async function tryRefresh() {
  const endpoints = [
    'https://platform.higgsfield.ai/auth/refresh',
    'https://platform.higgsfield.ai/api/auth/refresh',
    'https://platform.higgsfield.ai/v1/auth/refresh',
    'https://api.higgsfield.ai/auth/refresh',
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.post(url, {
        refresh_token: creds.refresh_token
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      console.log(`✅ SUCCESS at ${url}:`, res.data);
      return;
    } catch (err) {
      console.log(`❌ ${url}: ${err.response?.status || err.message}`);
    }
  }

  // Try with grant_type=refresh_token (OAuth2 standard)
  for (const url of endpoints) {
    try {
      const res = await axios.post(url, 
        `grant_type=refresh_token&refresh_token=${creds.refresh_token}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 5000
        }
      );
      console.log(`✅ OAUTH SUCCESS at ${url}:`, res.data);
      return;
    } catch (err) {
      console.log(`❌ OAUTH ${url}: ${err.response?.status || err.message}`);
    }
  }
}

tryRefresh();
