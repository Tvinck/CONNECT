const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`\n=== INTERCEPTED: ${req.method} ${req.url} ===`);
  console.log('Headers:', req.headers);
  
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    if (body) console.log('Body:', body);
    
    // Always return a dummy 200 JSON response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ dummy: "response", credits: 100, jobs: [] }));
  });
});

server.listen(8080, () => {
  console.log('Proxy listening on 8080');
});
