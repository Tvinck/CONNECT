const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const os = require('os');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testVercelFlow() {
  const tmpBase = path.join(os.tmpdir(), 'higgsfield_test_home');
  const configDir1 = path.join(tmpBase, '.config', 'higgsfield');
  const configDir2 = path.join(tmpBase, 'higgsfield');
  fs.mkdirSync(configDir1, { recursive: true });
  fs.mkdirSync(configDir2, { recursive: true });

  // 1. Fetch credentials from Supabase
  const { data } = await supabase
    .from('factory_generations')
    .select('video_url')
    .eq('prompt', 'cli_credentials')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    console.error('No credentials in Supabase!');
    return;
  }

  const credsText = data.video_url;
  fs.writeFileSync(path.join(configDir1, 'credentials.json'), credsText);
  fs.writeFileSync(path.join(configDir2, 'credentials.json'), credsText);

  console.log('Credentials written to test dir. Trying to run get command...');

  const jobId = 'b8e2fc95-d6e8-487a-8b2f-b62761db8223';
  const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate get ${jobId} --json`;

  try {
    const { stdout } = await execAsync(command, {
      env: { 
        ...process.env, 
        HOME: tmpBase, 
        XDG_CONFIG_HOME: tmpBase,
        APPDATA: tmpBase,
        USERPROFILE: tmpBase
      }
    });
    console.log('✅ Success! CLI output:');
    console.log(stdout.trim());
  } catch (err) {
    console.error('❌ Failed:', err.stderr || err.message);
  }
}

testVercelFlow();
