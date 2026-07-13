const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../bazzar-certs/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
  console.log('--- GETTING LIST OF TABLES ---');
  const { data: tables, error: tablesError } = await supabase
    .from('users') // we query users just to ensure connection, but let's query raw SQL via RPC or just query tables
    .select('*')
    .limit(1);
  
  // Since we can't run raw SQL easily without RPC, let's query what tables we know exist:
  // vpn_ggsel_logs, pm_api_logs, notifications, support_messages
  const tablesToCheck = ['vpn_ggsel_logs', 'pm_api_logs', 'bazzar_orders', 'bazzar_users', 'apple_certificates', 'bazzar_tickets', 'transactions'];
  for (const table of tablesToCheck) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`Table ${table}: count=${count}, error=${error ? error.message : 'none'}`);
  }

  console.log('\n--- FETCHING RECENT 10 GGSEL LOGS ---');
  const { data: ggselLogs, error: ggselLogsError } = await supabase
    .from('vpn_ggsel_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('vpn_ggsel_logs error:', ggselLogsError);
  console.log('vpn_ggsel_logs data:', JSON.stringify(ggselLogs, null, 2));

  console.log('\n--- FETCHING RECENT 10 PM API LOGS ---');
  const { data: pmLogs, error: pmLogsError } = await supabase
    .from('pm_api_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('pm_api_logs error:', pmLogsError);
  console.log('pm_api_logs data:', JSON.stringify(pmLogs, null, 2));
}

testSearch();
