require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('factory_generations')
    .select('*')
    .eq('prompt', 'web_push_subscriptions')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) console.error('Error:', error);
  else {
    if (data.length === 0) {
      console.log('NO SUBSCRIPTIONS FOUND IN DB');
    } else {
      console.log('Subscriptions DB Row:', JSON.stringify(data[0], null, 2));
    }
  }
}

check();
