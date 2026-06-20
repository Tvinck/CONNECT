const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
  const { data, error } = await supabase.from('vpn_servers').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Колонки vpn_servers:', Object.keys(data[0]));
  }
}

checkCols();
