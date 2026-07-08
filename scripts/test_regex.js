const db = require('fs').readFileSync('x-ui.db', 'utf8');
const match = db.match(/"publicKey":\s*"([^"]+)"/);
if (match) console.log('PBK IS:', match[1]);
else console.log('PBK Not found');

const sniMatch = db.match(/"serverNames":\s*\[\s*"([^"]+)"/);
if (sniMatch) console.log('SNI IS:', sniMatch[1]);
else console.log('SNI Not found');
