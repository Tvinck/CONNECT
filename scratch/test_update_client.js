const https = require('https');

const XUI_URL = 'https://185.142.99.185:36537/qsgoOThSkfHypc0BSW';
const XUI_USER = 'Uvt5i4YUGZ';
const XUI_PASS = 'ffeYdCd65h';

const agent = new https.Agent({ rejectUnauthorized: false });

async function run() {
  // 1. GET / -> get CSRF token
  const homeRes = await fetch(`${XUI_URL}/`, { agent });
  const html = await homeRes.text();
  const csrfMatch = html.match(/name="csrf-token"\s+content="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';
  const initialCookie = homeRes.headers.get('set-cookie');

  // 2. Login
  const loginRes = await fetch(`${XUI_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Csrf-Token': csrfToken,
      'Cookie': initialCookie
    },
    body: JSON.stringify({ username: XUI_USER, password: XUI_PASS }),
    agent
  });

  const authCookie = loginRes.headers.get('set-cookie');

  // 3. Get client
  const email = 'ca3b90ebefed4d8a93789659263d4e2e';
  const getRes = await fetch(`${XUI_URL}/panel/api/clients/get/${encodeURIComponent(email)}`, {
    headers: {
      'Cookie': authCookie,
      'X-Csrf-Token': csrfToken
    },
    agent
  });
  
  const getObj = await getRes.json();
  const client = getObj.obj.client;

  // Prepare payload
  const clientData = {
    id: client.uuid, // VLESS client UUID as string
    email: client.email,
    totalGB: client.totalGB,
    expiryTime: client.expiryTime,
    enable: client.enable,
    tgId: client.tgId,
    flow: client.flow,
    limitIp: client.limitIp,
    subId: client.subId
  };

  const tests = [
    {
      name: "clients/update with client.email (wrapped)",
      url: `${XUI_URL}/panel/api/clients/update/${encodeURIComponent(client.email)}`,
      body: { client: clientData }
    },
    {
      name: "clients/update with client.email (flat)",
      url: `${XUI_URL}/panel/api/clients/update/${encodeURIComponent(client.email)}`,
      body: clientData
    },
    {
      name: "clients/update with client.subId (wrapped)",
      url: `${XUI_URL}/panel/api/clients/update/${client.subId}`,
      body: { client: clientData }
    },
    {
      name: "clients/update with client.subId (flat)",
      url: `${XUI_URL}/panel/api/clients/update/${client.subId}`,
      body: clientData
    }
  ];

  for (const t of tests) {
    console.log(`\nTesting: ${t.name}`);
    const res = await fetch(t.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-Csrf-Token': csrfToken
      },
      body: JSON.stringify(t.body),
      agent
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  }
}

run().catch(console.error);
