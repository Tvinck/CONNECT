const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// We need service_role key to modify storage settings bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function increaseBucketLimit() {
  console.log('Inspecting storage buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    console.log('Found buckets:', buckets);
    const target = buckets.find(b => b.id === 'support-attachments');
    if (target) {
      console.log(`Current limit of support-attachments: ${target.max_file_size} bytes`);
      
      // Update bucket settings (set limit to 100MB = 104,857,600 bytes)
      console.log('Attempting to update bucket limit to 100MB...');
      const { data: updateRes, error: updateErr } = await supabase.storage.updateBucket('support-attachments', {
        public: true,
        maxFileSize: 104857600, // 100MB
        allowedMimeTypes: ['video/mp4', 'audio/mpeg', 'image/png', 'image/jpeg']
      });

      if (updateErr) throw updateErr;
      console.log('✅ Bucket limit updated successfully!', updateRes);
    } else {
      console.log('support-attachments bucket not found in list!');
    }
  } catch (e) {
    console.error('❌ Failed to update bucket:', e.message);
  }
}

increaseBucketLimit();
