const url = 'https://fhwrdhebhgywhvoeqpxj.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

async function run() {
  // Check tables using pg_meta or just trying to select from information_schema
  // Wait, REST API does not expose information_schema by default.
  // We can try fetching the OpenAPI spec which lists all tables
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const spec = await res.json();
  const tables = Object.keys(spec.definitions || {}).filter(k => !k.includes('_'));
  console.log('Available definitions in OpenAPI spec:');
  console.log(Object.keys(spec.definitions || {}).join(', '));
}

run().catch(console.error);
