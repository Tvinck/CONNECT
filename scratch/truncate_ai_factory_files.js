const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function truncateFiles() {
  console.log('Fetching files to truncate...');
  try {
    // 1. Chunks
    const { data: chunks } = await supabase.storage.from('support-attachments').list('chunks', { limit: 100 });
    if (chunks && chunks.length > 0) {
      console.log(`Truncating ${chunks.length} chunks...`);
      for (const c of chunks) {
        const path = `chunks/${c.name}`;
        const emptyBuffer = Buffer.from([]);
        const { error } = await supabase.storage
          .from('support-attachments')
          .upload(path, emptyBuffer, {
            contentType: 'video/mp4',
            upsert: true
          });
        if (error) {
          console.error(`Failed to truncate ${path}:`, error.message);
        } else {
          console.log(`Truncated ${path}`);
        }
      }
    }

    // 2. Renders
    const { data: renders } = await supabase.storage.from('support-attachments').list('renders', { limit: 100 });
    if (renders && renders.length > 0) {
      console.log(`Truncating ${renders.length} renders...`);
      for (const r of renders) {
        const path = `renders/${r.name}`;
        const emptyBuffer = Buffer.from([]);
        const { error } = await supabase.storage
          .from('support-attachments')
          .upload(path, emptyBuffer, {
            contentType: 'video/mp4',
            upsert: true
          });
        if (error) {
          console.error(`Failed to truncate ${path}:`, error.message);
        } else {
          console.log(`Truncated ${path}`);
        }
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

truncateFiles();
