const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('vpn_servers')
    .update({ reality_sni: 'gateway.icloud.com' })
    .gt('port', 0); // Updates all servers where port > 0 (which is all of them)
    
  if (error) {
    console.error('Error updating servers:', error);
    return;
  }
  console.log('Successfully updated reality_sni in Supabase to gateway.icloud.com for all servers.');
}

run().catch(console.error);
