const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function get() {
  const credentials = process.env.HIGGSFIELD_API_KEY;
  if (!credentials) {
    console.error('No credentials');
    return;
  }
  const parts = credentials.split(':');
  const headers = {
    Authorization: `Key ${parts[0]}:${parts[1]}`,
    'Content-Type': 'application/json'
  };

  console.log('Fetching schemas from Higgsfield platform API...');
  try {
    const res = await axios.get('https://platform.higgsfield.ai/schemas', { headers });
    console.log('Available Endpoints:');
    const endpoints = res.data.map(s => s.endpoint);
    console.log(JSON.stringify(endpoints, null, 2));
  } catch (err) {
    console.error('Failed:', err.response?.data || err.message);
  }
}

get();
