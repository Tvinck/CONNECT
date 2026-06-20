const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubs() {
  const { data, error } = await supabase.from('vpn_subscriptions').select('id, subscription_key').limit(3);
  console.log('Error:', error);
  console.log('Subscriptions:', JSON.stringify(data, null, 2));
}

checkSubs();
