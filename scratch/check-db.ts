import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://fhwrdhebhgywhvoeqpxj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4'
);

async function check() {
  const { data: p, error: pe } = await sb.from('profiles').select('*').limit(1);
  console.log('profiles:', p, pe);

  const { data: vs, error: vse } = await sb.from('vpn_subscriptions').select('*').limit(1);
  console.log('vpn_subscriptions:', vs, vse);
  
  const { data: vservers, error: vservere } = await sb.from('vpn_servers').select('*').limit(1);
  console.log('vpn_servers:', vservers, vservere);
}
check();
