const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
// Wait, the client script uses ANON_KEY? To UPDATE a row, we might need SERVICE_ROLE_KEY!
// Wait, we don't have VEIL_SUPABASE_SERVICE_ROLE_KEY. 
// Let's check if we can update with anon key (maybe RLS allows it?). If not, we have to use postgres direct connection, but we don't have the db password.
// Let's try!

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSNI() {
  console.log('Попытка обновить reality_sni в vpn_servers...');
  
  const { data: servers, error: err } = await supabase.from('vpn_servers').select('*');
  if (err) {
    console.error('Ошибка чтения:', err.message);
  } else {
    console.log('Текущие серверы:', servers);
  }
  
  // Обновляем IP 185.142.99.185
  const { data, error } = await supabase
    .from('vpn_servers')
    .update({ reality_sni: 'yahoo.com' })
    .eq('ip_address', '185.142.99.185')
    .select();
    
  if (error) {
    console.error('Ошибка обновления:', error.message);
  } else {
    console.log('Успешно обновлено:', data);
  }
}

updateSNI();
