const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServers() {
  const { data, error } = await supabase.from('vpn_servers').select('*');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

checkServers();
