const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('factory_generations').insert({
    prompt: 'Как хакеры взламывают домофоны? (Тестовое видео для демонстрации истории)',
    video_url: 'https://catbox.moe/c/dummy.mp4',
    feedback: null,
    feedback_comment: null
  });

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully inserted dummy record!");
  }
}

run();
