const net = require('net');

const client = new net.Socket();
console.log('Connecting to 185.142.99.185:443...');

client.setTimeout(5000);

client.connect(443, '185.142.99.185', () => {
  console.log('✅ Success! TCP port 443 is OPEN from the outside.');
  client.destroy();
});

client.on('error', (err) => {
  console.error('❌ Connection failed:', err.message);
});

client.on('timeout', () => {
  console.error('❌ Connection timed out after 5 seconds.');
  client.destroy();
});
