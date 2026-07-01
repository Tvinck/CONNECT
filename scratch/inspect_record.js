const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectRecord() {
  const { data } = await supabase
    .from('factory_generations')
    .select('*')
    .eq('id', 'fb04bc47-2859-4f9e-a8ed-6739ad7f3f1b')
    .single();

  console.log(JSON.stringify(data, null, 2));
}

inspectRecord();
