const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
  const { data, error } = await supabase.from('vpn_subscriptions').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Колонки vpn_subscriptions:', Object.keys(data[0]));
    console.log('First row token:', data[0].token);
  }
}

checkCols();
