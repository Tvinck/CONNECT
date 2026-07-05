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

async function watchLogin() {
  const credPath = path.join(os.homedir(), '.config', 'higgsfield', 'credentials.json');
  console.log(`Watching file for updates: ${credPath}`);
  
  if (!fs.existsSync(credPath)) {
    console.log('File does not exist yet. Waiting for login...');
  } else {
    const stats = fs.statSync(credPath);
    console.log(`Current file modified time: ${stats.mtime}`);
  }

  console.log('Checking file changes every 5 seconds (will run for 2 minutes)...');
  let count = 0;
  const interval = setInterval(async () => {
    count++;
    if (count > 24) {
      console.log('Timeout. Run the script again if you need to sync later.');
      clearInterval(interval);
      return;
    }

    if (fs.existsSync(credPath)) {
      try {
        const text = fs.readFileSync(credPath, 'utf8');
        const parsed = JSON.parse(text);
        
        // Check if access_token is present and not the expired one
        const expiredStart = 'hf_rbWRLTQvYUz5';
        if (parsed.access_token && !parsed.access_token.startsWith(expiredStart)) {
          console.log('\n🎉 Detected NEW credentials file! Uploading to Supabase...');
          const { error } = await supabase.from('factory_generations').insert({
            prompt: 'cli_credentials',
            video_url: text
          });

          if (error) {
            console.error('❌ Failed to save to Supabase:', error.message);
          } else {
            console.log('✅ Successfully updated tokens in Supabase database!');
            console.log('You can now use Higgsfield MCP and rendering queue without errors.');
            clearInterval(interval);
          }
        }
      } catch (e) {
        // File might be in write process, ignore parse errors temporarily
      }
    }
  }, 5000);
}

watchLogin();
