const axios = require('axios');

async function testMerge() {
  console.log('Sending mock request to local merge API...');
  try {
    const res = await axios.post('http://localhost:3000/api/factory/merge', {
      action: 'concat',
      processedUrls: [],
      musicUrl: 'lofi'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

testMerge();
