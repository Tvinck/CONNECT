const fetch = require('node-fetch');

const apiKey = 'f9f0e5bb-71aa-446b-83ca-4c1a433eb0e2:bbe53d2709bdbfcfaf670319924a054a9a31b6995f1c9a4703711ac115a5799f';
const cliToken = 'hf_nlnQy4p5A-gLVh1Uhuy8BRf0Fw13zfDN6-J9dx5DyqCmkyRqeBWlEffbC26-MLma';

async function testAuth(name, headers) {
  const url = 'https://mcp.higgsfield.ai/mcp';
  console.log(`\nTesting: ${name}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        ...headers
      }
    });
    console.log(`Response: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Body preview:', text.substring(0, 300));
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

async function runTests() {
  // Test 1: CLI Token as Bearer
  await testAuth('Bearer CLI Token', {
    'Authorization': `Bearer ${cliToken}`
  });

  // Test 2: API Key as Bearer
  await testAuth('Bearer API Key', {
    'Authorization': `Bearer ${apiKey}`
  });

  // Test 3: API Key as X-API-Key
  await testAuth('X-API-Key header', {
    'X-API-Key': apiKey
  });
}

runTests();
