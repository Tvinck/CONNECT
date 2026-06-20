const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('vpn_subscriptions')
    .select('id, token, status, expires_at, subscription_key, traffic_used, traffic_limit')
    .order('expires_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching subscriptions:', error);
    return;
  }
  console.log('Subscriptions in Database:', JSON.stringify(data, null, 2));
}

run().catch(console.error);
