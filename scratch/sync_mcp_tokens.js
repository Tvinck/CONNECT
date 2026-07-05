const fs = require('fs');
const path = require('path');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function syncMcpTokens() {
  console.log('Fetching latest credentials from Supabase...');
  const { data, error } = await supabase
    .from('factory_generations')
    .select('video_url')
    .eq('prompt', 'cli_credentials')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching credentials from DB:', error.message);
    return;
  }

  const credentialsText = data.video_url;
  const parsed = JSON.parse(credentialsText);
  console.log('Successfully fetched credentials. Access Token starts with:', parsed.access_token?.substring(0, 15));

  // Determine global config paths
  const userHome = os.homedir();
  console.log('User Home Directory:', userHome);

  const targets = [
    path.join(userHome, '.config', 'higgsfield', 'credentials.json'),
    path.join(userHome, 'higgsfield', 'credentials.json'),
    path.join(userHome, '.higgsfield', 'credentials.json'),
    path.join(process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming'), 'higgsfield', 'credentials.json')
  ];

  targets.forEach(t => {
    try {
      const dir = path.dirname(t);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(t, credentialsText, 'utf8');
      console.log(`✅ Saved credentials to: ${t}`);
    } catch (e) {
      console.error(`Failed to save to ${t}:`, e.message);
    }
  });

  // Run global refresh to verify
  console.log('Running pre-flight refresh on global home directory...');
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const { stdout, stderr } = await execAsync(
      'node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate list --json',
      { timeout: 15000 }
    );
    console.log('CLI check completed successfully!');
    
    // Read back updated file from one of the targets to see if it was refreshed
    const primaryTarget = targets[0];
    if (fs.existsSync(primaryTarget)) {
      const updatedText = fs.readFileSync(primaryTarget, 'utf8');
      if (updatedText !== credentialsText) {
        console.log('✅ Token was refreshed globally! Saving refreshed version to Supabase...');
        await supabase.from('factory_generations').insert({
          prompt: 'cli_credentials',
          video_url: updatedText
        });
      } else {
        console.log('Token is already fresh, no updates needed.');
      }
    }
  } catch (err) {
    console.warn('CLI refresh warning:', err.stderr || err.message);
  }
}

syncMcpTokens();
