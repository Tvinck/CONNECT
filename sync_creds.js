// Reads current local credentials and syncs them to Supabase DB
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshAndSync() {
  const localCredPaths = [
    path.join(os.homedir(), '.config', 'higgsfield', 'credentials.json'),
    path.join(os.homedir(), 'higgsfield', 'credentials.json'),
    path.join(process.env.APPDATA || '', 'higgsfield', 'credentials.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'higgsfield', 'credentials.json'),
  ];

  let credsText = null;
  for (const p of localCredPaths) {
    if (fs.existsSync(p)) {
      credsText = fs.readFileSync(p, 'utf8');
      console.log('Found local credentials at:', p);
      break;
    }
  }

  if (!credsText) {
    console.error('Credentials file not found locally! Please run: hf auth login');
    console.log('Searched paths:', localCredPaths);
    process.exit(1);
  }

  const creds = JSON.parse(credsText);
  console.log('Token preview:', creds.access_token?.substring(0, 30) + '...');

  // Test if credentials work
  try {
    const { stdout } = await execAsync('node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate list --json', {
      env: { ...process.env, HOME: os.homedir(), APPDATA: process.env.APPDATA }
    });
    const jobs = JSON.parse(stdout.trim());
    console.log(`✅ Credentials VALID — ${jobs.length} jobs found, latest: ${jobs[0]?.status}`);
  } catch (err) {
    console.error('❌ Credentials INVALID:', err.stderr || err.message);
    console.log('Please run: hf auth login in a terminal window');
    process.exit(1);
  }

  // Upload fresh credentials to Supabase
  console.log('Uploading fresh credentials to Supabase...');
  const { error } = await supabase.from('factory_generations').insert({
    prompt: 'cli_credentials',
    video_url: credsText
  });

  if (error) {
    console.error('Supabase upload error:', error);
    process.exit(1);
  }

  console.log('✅ Credentials synced to Supabase successfully!');
  console.log('Vercel will now use fresh tokens for all ИИ Завод operations.');
}

refreshAndSync();
