const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixKeys() {
  const { data: subs, error } = await supabase.from('vpn_subscriptions').select('id, subscription_key');
  if (error) {
    console.error('Ошибка:', error);
    return;
  }
  
  let updatedCount = 0;
  for (const s of subs) {
    if (s.subscription_key && s.subscription_key.includes('vless://')) {
      let newKey = s.subscription_key.replace('sub.veilvpn.net', '185.142.99.185');
      newKey = newKey.replace('gateway.icloud.com', 'yahoo.com');
      
      if (newKey !== s.subscription_key) {
        await supabase.from('vpn_subscriptions').update({ subscription_key: newKey }).eq('id', s.id);
        updatedCount++;
      }
    }
  }
  
  console.log('Исправлено ключей:', updatedCount);
}

fixKeys();
