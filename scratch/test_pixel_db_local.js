const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ktookvpqtmzfccojarwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b29rdnBxdG16ZmNjb2phcndtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMzc2NSwiZXhwIjoyMDgzODg5NzY1fQ.L99oEJS40e0R_l05Jm2kZkItJKdaPAEYrGM0WQ0y08Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const tables = ['users', 'profiles', 'creations', 'settings', 'subscriptions'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table ${table} error:`, error.message);
      } else {
        console.log(`Table ${table} success! Data count:`, data.length);
      }
    } catch (e) {
      console.log(`Table ${table} exception:`, e.message);
    }
  }
}

test();
