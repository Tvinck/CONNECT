const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PIXEL_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableRealtime() {
  console.log('Попытка включить Realtime для support_messages...');
  // К сожалению, supabase-js не поддерживает напрямую ALTER PUBLICATION
  // Но мы можем попробовать вызвать RPC, если такой существует
  
  // Просто проверим, включена ли репликация
  const { data, error } = await supabase.from('support_messages').select('*').limit(1);
  console.log('Доступ к support_messages:', data ? 'OK' : error);
}

enableRealtime();
