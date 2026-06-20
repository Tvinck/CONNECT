const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const connUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const connKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const veilUrl = process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL;
  const veilKey = process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY;

  console.log('--- Connecting to Connect DB ---');
  if (connUrl && connKey) {
    const supabase = createClient(connUrl, connKey);
    const { data, error } = await supabase.from('vpn_subscriptions').select('id, token, username, status, expires_at');
    if (error) console.error('Error Connect:', error.message);
    else console.log(`Found ${data.length} subscriptions. Samples:`, data.slice(0, 3));
  } else {
    console.log('Connect DB env missing.');
  }

  console.log('\n--- Connecting to Veil DB ---');
  if (veilUrl && veilKey) {
    const supabase = createClient(veilUrl, veilKey);
    const { data, error } = await supabase.from('vpn_subscriptions').select('id, token, username, status, expires_at');
    if (error) console.error('Error Veil:', error.message);
    else console.log(`Found ${data.length} subscriptions. Samples:`, data.slice(0, 3));
  } else {
    console.log('Veil DB env missing.');
  }
}

check().catch(console.error);
