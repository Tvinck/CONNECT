const fetch = require('node-fetch');

async function testSupabase() {
  const url = 'https://fhwrdhebhgywhvoeqpxj.supabase.co/rest/v1/bazzar_products?select=*';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM';
  
  console.log(`Sending test request to Supabase URL: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    console.log(`Response status: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.log('Response body:', body);
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

testSupabase();
