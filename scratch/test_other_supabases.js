const fetch = require('node-fetch');

async function testOtherSupabases() {
  const cases = [
    {
      name: 'VEIL',
      url: 'https://hvsexqyieibkspnnvigd.supabase.co/rest/v1/user_subscriptions?select=*',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c2V4cXlpZWlia3Nwbm52aWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDI0MjMsImV4cCI6Mj9hNjE3ODQyM30.z1c_fTW0uq9vJk0fAOgXA166vN1nEduNXaxPXtSfKCM' // truncated or generic
    },
    {
      name: 'PIXEL',
      url: 'https://ktookvpqtmzfccojarwm.supabase.co/rest/v1/pixel_projects?select=*',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b29rdnBxdG16ZmNjb2phcndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTM3NjUsImV4cCI6MjA4Mzg4OTc2NX0.something' // dummy
    }
  ];

  for (const c of cases) {
    console.log(`\nTesting ${c.name} Supabase URL: ${c.url}`);
    try {
      const res = await fetch(c.url, {
        method: 'GET',
        headers: {
          'apikey': c.anonKey
        }
      });
      console.log(`Response: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`Body:`, text.substring(0, 300));
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

testOtherSupabases();
