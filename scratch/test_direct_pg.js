const { Client } = require('pg');

async function testDirectPg() {
  const connectionString = 'postgresql://postgres:iW%40Bz%2C%2BdM42Ln%2B@db.fhwrdhebhgywhvoeqpxj.supabase.co:5432/postgres';
  console.log('Attempting direct connection to PostgreSQL...');
  
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('✅ Direct PostgreSQL connection successful!');
    
    // Fetch products
    console.log('Fetching bazzar_products...');
    const productsRes = await client.query('SELECT * FROM bazzar_products');
    console.log(`Found ${productsRes.rows.length} products.`);
    
    // Fetch reviews
    console.log('Fetching bazzar_reviews...');
    const reviewsRes = await client.query('SELECT * FROM bazzar_reviews');
    console.log(`Found ${reviewsRes.rows.length} reviews.`);

    // Save as local files
    const fs = require('fs');
    fs.writeFileSync('scratch/bazzar_products_backup.json', JSON.stringify(productsRes.rows, null, 2));
    fs.writeFileSync('scratch/bazzar_reviews_backup.json', JSON.stringify(reviewsRes.rows, null, 2));
    console.log('✅ Backups saved to scratch folder!');
    
  } catch (e) {
    console.error('❌ Direct PG connection failed:', e.message);
  } finally {
    await client.end();
  }
}

testDirectPg();
