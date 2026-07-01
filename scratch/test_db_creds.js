const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing inserting credentials into factory_generations...');
  const testCreds = JSON.stringify({ access_token: 'test_token', refresh_token: 'test_refresh' });
  
  const { data, error } = await supabase
    .from('factory_generations')
    .insert({
      prompt: 'cli_credentials',
      video_url: testCreds
    })
    .select();
    
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert success!', data);
    
    // Now test retrieving it
    const { data: getData, error: getError } = await supabase
      .from('factory_generations')
      .select('video_url')
      .eq('prompt', 'cli_credentials')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (getError) {
      console.error('Retrieve failed:', getError);
    } else {
      console.log('Retrieve success! Data:', getData);
    }
    
    // Cleanup the test row
    await supabase.from('factory_generations').delete().eq('id', data[0].id);
    console.log('Cleanup done!');
  }
}

test();
