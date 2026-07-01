const fetch = require('node-fetch');

async function checkChunkSizes() {
  const urls = [
    "https://fhwrdhebhgywhvoeqpxj.supabase.co/storage/v1/object/public/support-attachments/chunks/processed_e9e93748-5510-47c1-864d-c87635112abb.mp4",
    "https://fhwrdhebhgywhvoeqpxj.supabase.co/storage/v1/object/public/support-attachments/chunks/processed_94007c8b-326c-450a-b7d4-a16fa834b841.mp4",
    "https://fhwrdhebhgywhvoeqpxj.supabase.co/storage/v1/object/public/support-attachments/chunks/processed_e64666da-0a60-44a3-9a05-c29b2feec118.mp4"
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const sizeBytes = res.headers.get('content-length');
      const sizeMB = (parseInt(sizeBytes) / (1024 * 1024)).toFixed(2);
      console.log(`URL: ${url.substring(url.lastIndexOf('/') + 1)} | Size: ${sizeBytes} bytes (${sizeMB} MB)`);
    } catch (e) {
      console.error(`Error for ${url}:`, e.message);
    }
  }
}

checkChunkSizes();
