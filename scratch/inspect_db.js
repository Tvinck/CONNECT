const { createAdminClient } = require('../lib/supabase/admin');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const admin = createAdminClient();
  
  // Get all table names in public schema
  const { data: tables, error: err } = await admin.rpc('get_tables_info');
  if (err) {
    // Let's try direct query
    console.log('Error calling RPC get_tables_info:', err.message);
    
    // Check vpn_subscriptions
    const { data: subs, error: err2 } = await admin.from('vpn_subscriptions').select('*').limit(2);
    console.log('Subscriptions:', subs);
    console.log('Subscriptions error:', err2);
  } else {
    console.log('Tables:', tables);
  }
}

run();
