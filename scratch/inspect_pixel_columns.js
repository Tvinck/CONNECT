import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktookvpqtmzfccojarwm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b29rdnBxdG16ZmNjb2phcndtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMzc2NSwiZXhwIjoyMDgzODg5NzY1fQ.L99oEJS40e0R_l05Jm2kZkItJKdaPAEYrGM0WQ0y08Y';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function run() {
  console.log("Fetching schema info for all public tables...");
  
  // We can query using postgres RPC if available, or we can use a supabase query to a system view.
  // Wait, in Supabase, information_schema is usually not exposed over PostgREST unless there is a view or RPC.
  // Let's see if we can use supabase.rpc to execute sql.
  // Wait! Do we have a function to execute sql? Let's check if we can run a select.
  // If PostgREST doesn't expose information_schema, we can query it if we create a helper or if we run queries.
  // Let's check if we can run a query on a custom RPC or if we can run some select statements.
  // Wait, let's run a select query on creations, generations, subscriptions, orders using select().limit(0) which returns headers (columns)!
  const tables = ['creations', 'generations', 'subscriptions', 'orders', 'transactions', 'templates', 'users', 'user_stats'];
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table '${table}' query failed:`, error.message);
      } else {
        // If data is empty, we can check if we can get columns by selecting a specific row or if we can select '*' and inspect the keys of the returned empty array? Wait, an empty array has no keys.
        // Let's see if we can get column names by inserting a dummy roll and rolling back, or by querying columns from a view.
        // Wait, is there any row in these tables? Let's check if data has any row.
        if (data && data.length > 0) {
          console.log(`Table '${table}' columns:`, Object.keys(data[0]));
        } else {
          console.log(`Table '${table}' is empty. Let's try to fetch a single column or inspect via RPC.`);
          // Let's do a select of '*' and print the data or response
          console.log(`Table '${table}' returned empty array.`, data);
        }
      }
    } catch (e) {
      console.log(`Error querying '${table}':`, e.message);
    }
  }
}

run();
