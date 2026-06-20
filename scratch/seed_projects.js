import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM';

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false }
});

async function run() {
  console.log("Seeding projects using anon client...");
  
  const projects = [
    {
      name: 'Veil VPN',
      slug: 'veil',
      emoji: '🚀',
      color: '#1472F5',
      status: 'active',
      progress: 85,
      description: 'VPN-сервис на базе протокола VLESS Reality'
    },
    {
      name: 'Pixel AI',
      slug: 'pixel',
      emoji: '🎨',
      color: '#FF4D9D',
      status: 'active',
      progress: 90,
      description: 'Генератор фото и видео на базе искусственного интеллекта'
    }
  ];

  for (const proj of projects) {
    // Attempt upsert (requires unique constraint or policy check)
    const { data, error } = await supabase
      .from('projects')
      .upsert(proj, { onConflict: 'slug' })
      .select();
      
    if (error) {
      console.log(`Failed to seed project ${proj.slug}:`, error.message);
    } else {
      console.log(`Successfully seeded project ${proj.slug}:`, data);
    }
  }
}

run();
