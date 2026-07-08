const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars. url:', !!url, 'key:', !!key);
  process.exit(1);
}

const sb = createClient(url, key);

async function run() {
  // Check quick_replies
  const { data: qr, error: qrErr } = await sb.from('quick_replies').select('id, title, platform').order('sort_order');
  if (qrErr) {
    console.error('quick_replies ERROR:', qrErr.message);
    console.log('\n=== Run this SQL in Supabase SQL Editor ===');
    console.log(`
CREATE TABLE IF NOT EXISTS quick_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL DEFAULT 'all',
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
    `);
  } else {
    console.log('✅ quick_replies EXISTS, rows:', qr.length);
    qr.forEach(r => console.log(`  [${r.platform}] ${r.title}`));
  }

  // Check procedures
  const { data: procs, error: procErr } = await sb.from('procedures').select('id, title, platform').order('sort_order');
  if (procErr) {
    console.error('procedures ERROR:', procErr.message);
    console.log('\n=== Run this SQL in Supabase SQL Editor ===');
    console.log(`
CREATE TABLE IF NOT EXISTS procedures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL DEFAULT 'all',
  title text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
    `);
  } else {
    console.log('✅ procedures EXISTS, rows:', procs.length);
    procs.forEach(r => console.log(`  [${r.platform}] ${r.title}`));
  }
}

run().catch(console.error);
