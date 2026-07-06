require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  const { data, error } = await supabase.from('factory_generations').insert({
    prompt: 'test_insert',
    video_url: JSON.stringify([])
  });

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
