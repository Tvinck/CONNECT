const fetch = require('node-fetch');

async function listPixelRpc() {
  const url = 'https://ktookvpqtmzfccojarwm.supabase.co/rest/v1/';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b29rdnBxdG16ZmNjb2phcndtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMzc2NSwiZXhwIjoyMDgzODg5NzY1fQ.L99oEJS40e0R_l05Jm2kZkItJKdaPAEYrGM0WQ0y08Y';
  
  try {
    const res = await fetch(url, {
      headers: { 'apikey': key }
    });
    const schema = await res.json();
    console.log('Available tables & paths:');
    if (schema.paths) {
      Object.keys(schema.paths).forEach(p => {
        if (p.includes('/rpc/')) {
          console.log(`  RPC: ${p}`);
        } else {
          console.log(`  Path: ${p}`);
        }
      });
    } else {
      console.log('No paths found in schema', schema);
    }
  } catch (e) {
    console.error(e.message);
  }
}

listPixelRpc();
