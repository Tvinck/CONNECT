const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRecentProjects() {
  console.log('Fetching latest project states from Supabase...');
  
  // 1. Fetch queue state
  const { data: queueData } = await supabase
    .from('factory_generations')
    .select('*')
    .eq('prompt', 'factory_queue')
    .order('created_at', { ascending: false })
    .limit(5);

  if (queueData && queueData.length > 0) {
    console.log('\n--- GLOBAL QUEUE HISTORIES ---');
    for (const q of queueData) {
      console.log(`Created: ${q.created_at}`);
      try {
        const state = JSON.parse(q.video_url);
        console.log(`Active Project ID: ${state.activeProjectId}`);
        console.log(`Items count: ${state.items?.length}`);
        state.items?.forEach((it) => {
          console.log(`  - [${it.status}] ID: ${it.projectId} | Title: "${it.title}"`);
        });
      } catch (e) {
        console.log('Failed to parse queue state JSON');
      }
    }
  }

  // 2. Fetch individual project states
  const { data: states } = await supabase
    .from('factory_generations')
    .select('*')
    .like('prompt', 'project_state_%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (states && states.length > 0) {
    console.log('\n--- INDIVIDUAL PROJECT STATES ---');
    for (const s of states) {
      console.log(`\nPrompt: ${s.prompt} | Created: ${s.created_at}`);
      try {
        const val = JSON.parse(s.video_url);
        console.log(`Status: ${val.status}`);
        if (val.error) console.log(`Error: ${val.error}`);
        console.log(`Chunks count: ${val.chunks?.length}`);
        val.chunks?.forEach((c, idx) => {
          console.log(`  Scene ${idx+1}: Image: ${c.imageStatus} | Video: ${c.videoStatus} | Audio: ${c.audioStatus} | Processed: ${c.processedUrl ? 'YES' : 'NO'}`);
        });
      } catch (e) {
        console.log('Parse error');
      }
    }
  }
}

checkRecentProjects();
