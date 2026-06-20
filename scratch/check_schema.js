const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_schema_info', {});
  console.log(data, error);
}

checkSchema();
