const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubs() {
  const { data, error } = await supabase.from('vpn_subscriptions').select('id, subscription_key').limit(3);
  console.log('Error:', error);
  console.log('Subscriptions:', JSON.stringify(data, null, 2));
}

checkSubs();
