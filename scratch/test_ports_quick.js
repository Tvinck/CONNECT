const net = require('net');

function testPort(port, host) {
  const client = new net.Socket();
  console.log(`Connecting to ${host}:${port}...`);
  client.setTimeout(3000);
  
  client.connect(port, host, () => {
    console.log(`✅ ${host}:${port} is OPEN!`);
    client.destroy();
  });
  
  client.on('error', (err) => {
    console.error(`❌ ${host}:${port} failed:`, err.message);
  });
  
  client.on('timeout', () => {
    console.error(`❌ ${host}:${port} timed out.`);
    client.destroy();
  });
}

testPort(22, '185.142.99.185');
testPort(443, '185.142.99.185');
