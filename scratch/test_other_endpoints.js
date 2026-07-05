const fetch = require('node-fetch');

async function testOtherEndpoints() {
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM';
  
  // Test 1: bazzar_reviews
  console.log('Testing bazzar_reviews...');
  try {
    const res = await fetch('https://fhwrdhebhgywhvoeqpxj.supabase.co/rest/v1/bazzar_reviews?select=*', {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    console.log(`bazzar_reviews response: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`Found ${data.length} reviews.`);
  } catch (e) {
    console.error('Reviews check failed:', e.message);
  }

  // Test 2: increment_bazzar_analytics RPC
  console.log('Testing increment_bazzar_analytics RPC...');
  try {
    const res = await fetch('https://fhwrdhebhgywhvoeqpxj.supabase.co/rest/v1/rpc/increment_bazzar_analytics', {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ col_name: 'views' })
    });
    console.log(`increment_bazzar_analytics response: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (e) {
    console.error('Analytics RPC check failed:', e.message);
  }
}

testOtherEndpoints();
