const url = 'https://fhwrdhebhgywhvoeqpxj.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

async function run() {
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const spec = await res.json();
  
  console.log('vpn_subscriptions properties:');
  console.log(spec.definitions.vpn_subscriptions.properties);
  
  console.log('\nusers properties:');
  console.log(spec.definitions.users.properties);
  
  console.log('\nclients properties:');
  console.log(spec.definitions.clients.properties);
}

run().catch(console.error);
