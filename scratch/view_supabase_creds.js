const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.storage.from('support-attachments').download('cli_credentials.json');
  if (error) {
    console.error('Error downloading:', error);
    return;
  }
  const text = await data.text();
  console.log('Credentials in Supabase:', text);
}

check();
