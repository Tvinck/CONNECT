const dns = require('dns').promises;
const https = require('https');

async function run() {
  // Use a custom resolver querying 8.8.8.8 to bypass local fake-ip dns
  const resolver = new dns.Resolver();
  resolver.setServers(['8.8.8.8']);
  
  console.log('Resolving Supabase host...');
  const hostname = 'fhwrdhebhgywhvoeqpxj.supabase.co';
  const addresses = await resolver.resolve4(hostname);
  const realIp = addresses[0];
  console.log(`Resolved IP: ${realIp}`);
  
  const path = '/rest/v1/support_messages?select=id,message,sender_email,is_from_user,created_at&order=created_at.desc&limit=15';
  const url = `https://${realIp}${path}`;
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';
  
  const options = {
    hostname: realIp,
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'host': hostname, // CRITICAL: must pass the original hostname in Host header
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    rejectUnauthorized: false // Needed since we connect by IP address
  };
  
  console.log('Sending request to Supabase...');
  const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('=== Latest Support Messages ===');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (err) {
        console.log(data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });
  
  req.end();
}

run().catch(console.error);
