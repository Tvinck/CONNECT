import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log('Cleaning up dummy.mp4 from database...');
  const { data, error } = await supabase
    .from('factory_generations')
    .delete()
    .eq('video_url', 'https://catbox.moe/c/dummy.mp4');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Cleanup successful!', data);
  }
}

cleanup();
