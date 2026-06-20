const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkToken() {
  const { data, error } = await supabase.from('vpn_subscriptions').select('*').eq('token', '719491ae32b144029d61c136a4155dc5');
  console.log(data);
}
checkToken();
