const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Checking recent factory_generations rows...');
  const { data, error } = await supabase
    .from('factory_generations')
    .select('*')
    .neq('prompt', 'cli_credentials')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Fetch failed:', error);
  } else {
    console.log('Recent Database Generations:');
    data.forEach(row => {
      console.log(`ID: ${row.id} | Prompt: ${row.prompt.substring(0, 50)}... | Created: ${row.created_at}`);
    });
  }
}

test();
