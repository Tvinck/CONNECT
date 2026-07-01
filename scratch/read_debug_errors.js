const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function readDebugErrors() {
  console.log('Fetching latest debug merge errors from Supabase...');
  const { data, error } = await supabase
    .from('factory_generations')
    .select('*')
    .eq('prompt', 'debug_merge_error')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching debug logs:', error);
    return;
  }

  console.log(`Found ${data.length} error logs:`);
  data.forEach((r, idx) => {
    console.log(`\n--- ERROR LOG #${idx+1} | Created: ${r.created_at} ---`);
    try {
      const err = JSON.parse(r.video_url);
      console.log('Message:', err.message);
      console.log('Stack Trace:', err.stack);
      console.log('Request Body preview:', err.body?.substring(0, 500));
    } catch (e) {
      console.log('Raw contents:', r.video_url);
    }
  });
}

readDebugErrors();
