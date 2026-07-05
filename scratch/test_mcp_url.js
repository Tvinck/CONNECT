const fetch = require('node-fetch');

async function testMcpUrl() {
  const url = 'https://mcp.higgsfield.ai/mcp';
  console.log(`Sending test request to MCP Higgsfield URL: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream' // SSE format
      }
    });
    console.log(`Response Status: ${res.status} ${res.statusText}`);
    console.log('Response Headers:');
    res.headers.forEach((val, key) => console.log(`  ${key}: ${val}`));
    const body = await res.text();
    console.log('Response body preview (first 500 chars):', body.substring(0, 500));
  } catch (e) {
    console.error('Connection failed:', e.message);
  }
}

testMcpUrl();
