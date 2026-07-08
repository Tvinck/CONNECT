const apiKey = "f9f0e5bb-71aa-446b-83ca-4c1a433eb0e2:bbe53d2709bdbfcfaf670319924a054a9a31b6995f1c9a4703711ac115a5799f";
const headers = { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' };

async function checkUrl(url) {
  try {
    const res = await fetch(url, { headers });
    console.log(`[${res.status}] ${url}`);
    if (res.status === 200) console.log(await res.text());
  } catch (e) {
    console.log(`[ERR] ${url} ${e.message}`);
  }
}

async function run() {
  await checkUrl('https://platform.higgsfield.ai/v1/account/status');
  await checkUrl('https://platform.higgsfield.ai/account/status');
  await checkUrl('https://platform.higgsfield.ai/v1/auth/me');
  await checkUrl('https://platform.higgsfield.ai/requests');
  await checkUrl('https://platform.higgsfield.ai/generate/list');
}
run();
