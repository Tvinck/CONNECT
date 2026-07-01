const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRecentRecords() {
  console.log('Fetching last 15 raw records from factory_generations...');
  const { data, error } = await supabase
    .from('factory_generations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Found ${data.length} records:`);
  data.forEach((r, idx) => {
    console.log(`[${idx}] ID: ${r.id} | Prompt: "${r.prompt?.substring(0, 50)}" | Video URL length: ${r.video_url?.length || 0} | Created: ${r.created_at}`);
  });
}

checkRecentRecords();
