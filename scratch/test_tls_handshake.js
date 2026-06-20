const tls = require('tls');

const options = {
  host: '185.142.99.185',
  port: 443,
  servername: 'gateway.icloud.com', // SNI
  rejectUnauthorized: false // We just want to inspect the certificate
};

console.log('Initiating TLS handshake with 185.142.99.185:443 using SNI gateway.icloud.com...');

const socket = tls.connect(options, () => {
  console.log('✅ TLS handshake completed successfully!');
  console.log('Protocol:', socket.getProtocol());
  console.log('Cipher:', socket.getCipher());
  
  const cert = socket.getPeerCertificate();
  console.log('=== Peer Certificate ===');
  console.log('Subject:', cert.subject);
  console.log('Issuer:', cert.issuer);
  console.log('Valid From:', cert.valid_from);
  console.log('Valid To:', cert.valid_to);
  
  socket.destroy();
});

socket.on('error', (err) => {
  console.error('❌ TLS handshake failed:', err.message);
});
