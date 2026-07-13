const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../bazzar-certs/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const UDID = '00008150-000C5C242187401C';

async function activateClient() {
  console.log(`Activating client with UDID: ${UDID}`);

  // 1. Update bazzar_users - set status to bought, plan to esign
  const { data: userData, error: userError } = await supabase
    .from('bazzar_users')
    .update({
      status: 'bought',
      plan: 'esing',
      last_purchase: new Date().toISOString()
    })
    .eq('udid', UDID)
    .select();

  if (userError) {
    console.error('Error updating bazzar_users:', userError);
  } else {
    console.log('bazzar_users updated:', JSON.stringify(userData, null, 2));
  }

  // 2. Create apple_certificates entry
  const { data: certData, error: certError } = await supabase
    .from('apple_certificates')
    .insert({
      udid: UDID,
      plan_id: 'esing',
      source: 'GGSel',
      sale_price: 400,
      crm_status: 'pending'
    })
    .select();

  if (certError) {
    console.error('Error inserting apple_certificates:', certError);
  } else {
    console.log('apple_certificates created:', JSON.stringify(certData, null, 2));
  }

  // 3. Create a bazzar_orders entry manually
  const { data: orderData, error: orderError } = await supabase
    .from('bazzar_orders')
    .insert({
      uniquecode: 'MANUAL-' + UDID.substring(0, 8),
      item_name: 'Сертификат разработчика Apple - ESign',
      udid: UDID,
      status: 'linked',
      created_at: new Date().toISOString()
    })
    .select();

  if (orderError) {
    console.error('Error inserting bazzar_orders:', orderError);
  } else {
    console.log('bazzar_orders created:', JSON.stringify(orderData, null, 2));
  }

  // 4. Verify final state
  const { data: finalUser } = await supabase
    .from('bazzar_users')
    .select('*')
    .eq('udid', UDID)
    .single();
  console.log('\nFinal user state:', JSON.stringify(finalUser, null, 2));
}

activateClient();
