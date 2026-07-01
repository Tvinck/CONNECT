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

async function test() {
  const tmpBase = os.tmpdir();
  const configDir1 = path.join(tmpBase, '.config', 'higgsfield');
  const configDir2 = path.join(tmpBase, 'higgsfield');
  fs.mkdirSync(configDir1, { recursive: true });
  fs.mkdirSync(configDir2, { recursive: true });

  console.log('Downloading credentials from Supabase Database...');
  const { data: dbData, error: downloadError } = await supabase
    .from('factory_generations')
    .select('video_url')
    .eq('prompt', 'cli_credentials')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (downloadError) {
    console.error('Download error:', downloadError);
    return;
  }
  const text = dbData.video_url;

  const credPath1 = path.join(configDir1, 'credentials.json');
  const credPath2 = path.join(configDir2, 'credentials.json');
  fs.writeFileSync(credPath1, text);
  fs.writeFileSync(credPath2, text);

  console.log('Fetching recent CLI jobs from Higgsfield...');
  try {
    const { stdout } = await execAsync('node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate list --json', {
      env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase }
    });
    const jobs = JSON.parse(stdout.trim());
    console.log('Recent CLI Jobs:');
    jobs.slice(0, 10).forEach(job => {
      console.log(`ID: ${job.id} | Type: ${job.job_set_type} | Status: ${job.status} | Created: ${new Date(job.created_at * 1000).toLocaleString()}`);
    });
  } catch (err) {
    console.error('CLI list failed:', err.stderr || err.message);
  }
}

test();
