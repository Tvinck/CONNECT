const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ktookvpqtmzfccojarwm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b29rdnBxdG16ZmNjb2phcndtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMzc2NSwiZXhwIjoyMDgzODg5NzY1fQ.L99oEJS40e0R_l05Jm2kZkItJKdaPAEYrGM0WQ0y08Y'
);

async function checkPixelTables() {
  console.log('Checking bazzar tables on PIXEL Supabase database...');
  try {
    const { data: prodData, error: prodErr } = await supabase.from('bazzar_products').select('*').limit(1);
    if (prodErr) {
      console.log('bazzar_products table check:', prodErr.message);
    } else {
      console.log('bazzar_products table exists! Row count:', prodData.length);
    }

    const { data: revData, error: revErr } = await supabase.from('bazzar_reviews').select('*').limit(1);
    if (revErr) {
      console.log('bazzar_reviews table check:', revErr.message);
    } else {
      console.log('bazzar_reviews table exists! Row count:', revData.length);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkPixelTables();
