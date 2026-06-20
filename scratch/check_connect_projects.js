import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM';

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false }
});

async function run() {
  const { data, error } = await supabase.from('projects').select('*');
  console.log("Projects in connect DB:", error || data);
}

run();
