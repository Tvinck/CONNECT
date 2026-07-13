const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function getDigisellerSales() {
  const sellerId = process.env.DIGISELLER_SELLER_ID || '1140096';
  const apiKey = process.env.DIGISELLER_API_KEY || '3FE4509457F540DDB25BDF7C85A99AF5';
  
  console.log('Authenticating with Digiseller:', sellerId);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

  try {
    const loginRes = await fetch('https://api.digiseller.ru/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        seller_id: parseInt(sellerId, 10),
        timestamp: parseInt(timestamp, 10),
        sign: sign
      })
    });
    
    const loginData = await loginRes.json();
    console.log('Digiseller Login Response:', loginData);
    
    if (!loginData.token) {
      console.error('Failed to login to Digiseller');
      return;
    }
    
    const token = loginData.token;
    
    // Now fetch last sales
    console.log('Fetching last sales...');
    const salesRes = await fetch(`https://api.digiseller.ru/api/seller-last-sales?seller_id=${sellerId}&token=${token}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const salesData = await salesRes.json();
    console.log('Sales Count:', salesData.rows);
    console.log('Sales:', JSON.stringify(salesData.sales || salesData, null, 2));
  } catch (err) {
    console.error('Error fetching Digiseller sales:', err);
  }
}

async function getGgselSales() {
  const sellerId = process.env.GGSEL_SELLER_ID || '1140096';
  const apiKey = process.env.GGSEL_API_KEY || '9abb0e779f8c71004895735bac8b808a0dc52b68d29fab11eec453140266f63d';
  
  console.log('\nAuthenticating with GGSel:', sellerId);
  const timestamp = Date.now().toString();
  const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

  try {
    const loginRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        seller_id: parseInt(sellerId, 10),
        timestamp: timestamp,
        sign: sign
      })
    });
    
    const loginData = await loginRes.json();
    console.log('GGSel Login Response:', loginData);
    
    if (!loginData.token) {
      console.error('Failed to login to GGSel');
      return;
    }
    
    const token = loginData.token;
    
    // Now fetch last sales
    console.log('Fetching last sales from GGSel...');
    const salesRes = await fetch(`https://seller.ggsel.com/api_sellers/api/seller-last-sales?seller_id=${sellerId}&token=${token}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const salesData = await salesRes.json();
    console.log('GGSel Sales:', JSON.stringify(salesData, null, 2));
  } catch (err) {
    console.error('Error fetching GGSel sales:', err);
  }
}

async function main() {
  const sellerId = process.env.GGSEL_SELLER_ID || '1140096';
  const apiKey = process.env.GGSEL_API_KEY || '9abb0e779f8c71004895735bac8b808a0dc52b68d29fab11eec453140266f63d';
  
  console.log('Authenticating with GGSel:', sellerId);
  const timestamp = Date.now().toString();
  const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

  try {
    const loginRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        seller_id: parseInt(sellerId, 10),
        timestamp: timestamp,
        sign: sign
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.token) {
      console.error('Failed to login to GGSel');
      return;
    }
    
    const token = loginData.token;
    
    const invoices = [38869645, 38863576, 38837015];
    for (const invId of invoices) {
      console.log(`\n--- Fetching details for invoice ${invId} ---`);
      // Note: check if Digiseller api accepts seller token
      const infoRes = await fetch(`https://api.digiseller.ru/api/purchase/info/${invId}?token=${token}`, {
        headers: { 'Accept': 'application/json' }
      });
      const infoData = await infoRes.json();
      console.log(`Invoice ${invId} details:`, JSON.stringify(infoData, null, 2));
    }
  } catch (err) {
    console.error('Error in main:', err);
  }
}

main();
