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

  console.log('Downloading credentials from Supabase...');
  const { data: fileData, error: downloadError } = await supabase.storage.from('support-attachments').download('cli_credentials.json');
  if (downloadError) {
    console.error('Download error:', downloadError);
    return;
  }
  const text = await fileData.text();
  console.log('Creds downloaded:', text);

  const credPath1 = path.join(configDir1, 'credentials.json');
  const credPath2 = path.join(configDir2, 'credentials.json');
  fs.writeFileSync(credPath1, text);
  fs.writeFileSync(credPath2, text);

  console.log('Running Higgsfield CLI command...');
  try {
    const { stdout, stderr } = await execAsync('node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create inworld_text_to_speech --voice "Dmitry (ru)" --prompt "Привет чат" --json', {
      env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase }
    });
    console.log('STDOUT:', stdout);
    console.log('STDERR:', stderr);
  } catch (err) {
    console.error('CLI execution failed:', err.stderr || err.message);
  }
}

test();
