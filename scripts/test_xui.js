const https = require('https');

async function test() {
  const xuiUrl = 'https://185.142.99.185:36537/qsgoOThSkfHypc0BSW';
  const xuiUser = 'Uvt5i4YUGZ';
  const xuiPass = 'ffeYdCd65h';

  // 1. Fetch home page to get CSRF token and session cookie
  let homeRes = await fetch(`${xuiUrl}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  const html = await homeRes.text();
  const csrfMatch = html.match(/name="csrf-token"\s+content="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';

  const rawCookies = homeRes.headers.getSetCookie ? homeRes.headers.getSetCookie() : (homeRes.headers.get('set-cookie') || []);
  const rawSessionCookie = Array.isArray(rawCookies) ? rawCookies[0] : rawCookies;
  const sessionCookie = rawSessionCookie ? rawSessionCookie.split(';')[0] : '';

  // 2. Login
  const formData = new URLSearchParams();
  formData.append('username', xuiUser);
  formData.append('password', xuiPass);

  let res = await fetch(`${xuiUrl}/login`, {
    method: 'POST',
    body: formData,
    headers: {
      'Origin': 'https://185.142.99.185:36537',
      'Referer': `${xuiUrl}/`,
      'X-Csrf-Token': csrfToken,
      'Cookie': sessionCookie
    }
  });
  
  const authCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get('set-cookie') || []);
  const rawAuthCookie = Array.isArray(authCookies) ? authCookies[0] : authCookies;
  const authCookie = rawAuthCookie ? rawAuthCookie.split(';')[0] : '';
  const finalCookie = authCookie || sessionCookie;

  if (res.status !== 200) {
    console.error("Login failed");
    return;
  }

  // Get client details
  const email = '719491ae32b144029d61c136a4155dc5-grpc';
  let clientRes = await fetch(`${xuiUrl}/panel/api/clients/get/${encodeURIComponent(email)}`, {
    headers: {
      'Cookie': finalCookie,
      'X-Csrf-Token': csrfToken
    }
  });
  console.log("Client Get Status:", clientRes.status);
  const clientData = await clientRes.json();
  console.log("Client Data:", JSON.stringify(clientData, null, 2));

}
test();



