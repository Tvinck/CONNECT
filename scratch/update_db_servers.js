const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function update() {
  console.log('Updating vpn_servers in Supabase...');
  
  const { data, error } = await supabase
    .from('vpn_servers')
    .update({ reality_sni: 'www.microsoft.com' })
    .neq('reality_sni', 'www.microsoft.com'); // Only update if not already www.microsoft.com

  if (error) {
    console.error('Error updating servers:', error.message);
  } else {
    console.log('Successfully updated servers:', data);
  }

  // Also query to double-check
  const { data: servers, error: err2 } = await supabase.from('vpn_servers').select('id, name, reality_sni');
  if (err2) {
    console.error('Error verifying servers:', err2.message);
  } else {
    console.log('Current Servers State:');
    servers.forEach(s => {
      console.log(`- ${s.name}: SNI is "${s.reality_sni}"`);
    });
  }
}

update().catch(console.error);
