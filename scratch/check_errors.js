const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProjectErrors() {
  console.log('Checking latest project states and errors from Supabase...');
  
  // Fetch latest project states
  const { data, error } = await supabase
    .from('factory_generations')
    .select('*')
    .like('prompt', 'project_state_%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  data.forEach((r) => {
    try {
      const state = JSON.parse(r.video_url);
      console.log(`\nProject ID: ${state.projectId} | Status: ${state.status} | Created: ${r.created_at}`);
      if (state.error) {
        console.log(`❌ ERROR:`, state.error);
      } else {
        console.log(`No error recorded in state.`);
      }
      console.log(`Chunks count: ${state.chunks?.length}`);
      state.chunks?.forEach((c, i) => {
        console.log(`  Scene ${i+1}: processedUrl = ${c.processedUrl?.substring(0, 60)}...`);
      });
    } catch (e) {
      console.log(`Failed to parse state for ${r.prompt}:`, e.message);
    }
  });
}

checkProjectErrors();
