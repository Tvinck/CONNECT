const http = require('https');

http.get('https://connect-three-green.vercel.app/api/monitoring/status', (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('=== PING RESULTS ===');
      console.log('Timestamp:', new Date(data.timestamp).toLocaleString());
      
      console.log('\n--- WEBSITES ---');
      Object.entries(data.websites).forEach(([key, val]) => {
        console.log(`${val.name}: ${val.status} (latency: ${val.latency}ms)`);
      });

      console.log('\n--- DATABASES ---');
      Object.entries(data.databases).forEach(([key, val]) => {
        console.log(`${val.name}: ${val.status} (latency: ${val.latency}ms)`);
      });

      console.log('\n--- VPS STATUS ---');
      console.log(`VPS Server: ${data.vps.status} (latency: ${data.vps.latency}ms)`);
      if (data.vps.error) {
        console.log('VPS Connection Error:', data.vps.error);
      }
      
      console.log('\n--- PROCESSES ---');
      data.vps.processes.forEach(p => {
        console.log(`Process ${p.name}: ${p.status} (CPU: ${p.cpu}%, RAM: ${Math.round(p.memory / 1024 / 1024)}MB, restarts: ${p.restarts})`);
      });

    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      console.log('Response was:', body);
    }
  });
}).on('error', (e) => {
  console.error('Request error:', e.message);
});
