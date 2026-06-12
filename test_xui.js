const https = require('https');

async function test() {
  const xuiUrl = 'https://185.142.99.185:36537/qsgoOThSkfHypc0BSW'
  const xuiUser = 'Uvt5i4YUGZ'
  const xuiPass = 'ffeYdCd65h'

  const formData = new URLSearchParams();
  formData.append('username', xuiUser);
  formData.append('password', xuiPass);

  let res = await fetch(`${xuiUrl}/login`, {
    method: 'POST',
    body: formData,
    dispatcher: new (require('undici').Agent)({
      connect: { rejectUnauthorized: false }
    }),
    headers: {
      'Origin': 'https://185.142.99.185:36537',
      'Referer': `${xuiUrl}/`
    }
  });
  
  console.log("Status:", res.status);
  console.log("Cookies:", res.headers.get('set-cookie'));
  const txt = await res.text();
  console.log("Body:", txt);
}
test();
