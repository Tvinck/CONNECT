
const url = 'https://ktookvpqtmzfccojarwm.supabase.co/rest/v1/';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b29rdnBxdG16ZmNjb2phcndtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMzc2NSwiZXhwIjoyMDgzODg5NzY1fQ.L99oEJS40e0R_l05Jm2kZkItJKdaPAEYrGM0WQ0y08Y';

async function run() {
  const res = await fetch(url, {
    headers: { 'apikey': apiKey }
  });
  const schema = await res.json();
  
  const targetTables = ['creations', 'transactions', 'subscriptions', 'templates', 'users', 'user_stats'];
  for (const table of targetTables) {
    console.log(`====================================`);
    console.log(`Table: ${table}`);
    const def = schema.definitions[table];
    if (!def) {
      console.log(`Not found in definitions!`);
      continue;
    }
    console.log(`Properties:`, Object.keys(def.properties));
    console.log(`Required:`, def.required);
  }
}

run();
