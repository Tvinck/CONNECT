const fetch = require('node-fetch');

async function checkSuccessSize() {
  const url = "https://fhwrdhebhgywhvoeqpxj.supabase.co/storage/v1/object/public/support-attachments/renders/merged_074d427c-40a9-45f2-af3b-edd489aad406.mp4";
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const sizeBytes = res.headers.get('content-length');
    const sizeMB = (parseInt(sizeBytes) / (1024 * 1024)).toFixed(2);
    console.log(`Success size: ${sizeBytes} bytes (${sizeMB} MB)`);
  } catch (e) {
    console.error(e.message);
  }
}

checkSuccessSize();
