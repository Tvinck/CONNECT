const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log('Fetching subscriptions...');
  const { data: subs, error: err1 } = await supabase.from('vpn_subscriptions').select('*');
  if (err1) {
    console.error('Error fetching subscriptions:', err1.message);
  } else {
    console.log(`Found ${subs.length} subscriptions.`);
    subs.forEach(s => {
      console.log(`- Token: ${s.token}, User: ${s.username}, Status: ${s.status}, Key: ${s.subscription_key}`);
    });
  }

  console.log('\nFetching servers...');
  const { data: servers, error: err2 } = await supabase.from('vpn_servers').select('*');
  if (err2) {
    console.error('Error fetching servers:', err2.message);
  } else {
    console.log(`Found ${servers.length} servers.`);
    servers.forEach(s => {
      console.log(`- ID: ${s.id}, Name: ${s.name}, IP: ${s.ip_address}, Country: ${s.country_code}`);
    });
  }
}

check().catch(console.error);
