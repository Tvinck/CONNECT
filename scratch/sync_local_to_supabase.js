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

async function syncLocalToSupabase() {
  const userHome = os.homedir();
  const credPath = path.join(userHome, '.config', 'higgsfield', 'credentials.json');
  
  if (!fs.existsSync(credPath)) {
    console.error(`Local credentials file not found at: ${credPath}`);
    return;
  }

  try {
    const text = fs.readFileSync(credPath, 'utf8');
    const parsed = JSON.parse(text);
    console.log('Reading local credentials... Access Token starts with:', parsed.access_token?.substring(0, 15));

    console.log('Uploading local credentials to Supabase...');
    const { error } = await supabase.from('factory_generations').insert({
      prompt: 'cli_credentials',
      video_url: text
    });

    if (error) {
      console.error('❌ Failed to save to Supabase:', error.message);
    } else {
      console.log('✅ Successfully synced fresh local credentials to Supabase database!');
      
      // Copy to other local config folders to ensure complete sync
      const targets = [
        path.join(userHome, 'higgsfield', 'credentials.json'),
        path.join(userHome, '.higgsfield', 'credentials.json'),
        path.join(process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming'), 'higgsfield', 'credentials.json')
      ];

      targets.forEach(t => {
        const dir = path.dirname(t);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(t, text, 'utf8');
        console.log(`Copied to: ${t}`);
      });
    }
  } catch (e) {
    console.error('Error during sync:', e.message);
  }
}

syncLocalToSupabase();
