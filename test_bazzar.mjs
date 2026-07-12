import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('bazzar_orders').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", data);
    if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("No data, but table exists. Let's try inserting a dummy row to get the schema or wait, we can't easily get schema if it's empty via REST.");
      // If we insert dummy and let it fail, maybe it tells us?
      const { error: err2 } = await supabase.from('bazzar_orders').insert([{ dummy_non_existent: 1 }]);
      console.log("Insert error (should contain column info maybe):", err2);
    }
  }
}
main();
