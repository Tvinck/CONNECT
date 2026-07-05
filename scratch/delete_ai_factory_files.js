const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAiFactoryFiles() {
  console.log('Connecting to storage and listing files to delete...');
  
  try {
    // List chunks
    console.log('Listing chunks...');
    const { data: chunks, error: chunksErr } = await supabase.storage
      .from('support-attachments')
      .list('chunks', { limit: 100 });
      
    if (chunksErr) {
      console.error('Error listing chunks:', chunksErr.message);
    } else if (chunks) {
      console.log(`Found ${chunks.length} chunks to delete.`);
      const chunkPaths = chunks.map(c => `chunks/${c.name}`);
      if (chunkPaths.length > 0) {
        const { data: delChunks, error: delChunksErr } = await supabase.storage
          .from('support-attachments')
          .remove(chunkPaths);
        if (delChunksErr) console.error('Error deleting chunks:', delChunksErr.message);
        else console.log('Successfully deleted chunks:', delChunks);
      }
    }

    // List renders
    console.log('Listing renders...');
    const { data: renders, error: rendersErr } = await supabase.storage
      .from('support-attachments')
      .list('renders', { limit: 100 });
      
    if (rendersErr) {
      console.error('Error listing renders:', rendersErr.message);
    } else if (renders) {
      console.log(`Found ${renders.length} renders to delete.`);
      const renderPaths = renders.map(r => `renders/${r.name}`);
      if (renderPaths.length > 0) {
        const { data: delRenders, error: delRendersErr } = await supabase.storage
          .from('support-attachments')
          .remove(renderPaths);
        if (delRendersErr) console.error('Error deleting renders:', delRendersErr.message);
        else console.log('Successfully deleted renders:', delRenders);
      }
    }
  } catch (e) {
    console.error('Execution error:', e.message);
  }
}

deleteAiFactoryFiles();
