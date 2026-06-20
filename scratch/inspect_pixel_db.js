import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktookvpqtmzfccojarwm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b29rdnBxdG16ZmNjb2phcndtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMzc2NSwiZXhwIjoyMDgzODg5NzY1fQ.L99oEJS40e0R_l05Jm2kZkItJKdaPAEYrGM0WQ0y08Y';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function run() {
  console.log("Fetching tables from remote Supabase...");
  const { data, error } = await supabase.rpc('get_tables_info');
  if (error) {
    console.log("RPC get_tables_info failed, trying SQL query directly via execution...");
    // Fallback: Query pg_catalog via execute_sql or simple select if exposed.
    // Let's run a select query on pg_tables.
    const { data: tables, error: tableErr } = await supabase.from('pg_tables').select('*').limit(1);
    console.log("Table check error:", tableErr);
  } else {
    console.log("Tables info:", JSON.stringify(data, null, 2));
  }
  
  // Let's query information_schema.tables using an RPC or we can run a query.
  // Wait, let's try a few known tables to see if they exist.
  const knownTables = ['users', 'user_stats', 'creations', 'generations', 'templates', 'transactions', 'subscriptions', 'orders', 'purchases', 'payments'];
  for (const table of knownTables) {
    const { data: cols, error: colErr } = await supabase.from(table).select('*').limit(1);
    if (colErr) {
      console.log(`Table '${table}' does not exist or has error:`, colErr.message);
    } else {
      console.log(`Table '${table}' exists. Columns in first row:`, cols.length > 0 ? Object.keys(cols[0]) : '(empty)');
    }
  }
}

run();
