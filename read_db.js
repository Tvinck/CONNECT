const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('x-ui.db');

db.serialize(() => {
  db.all("SELECT id, protocol, stream_settings, settings FROM inbounds", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Inbounds count:", rows.length);
    rows.forEach(row => {
      console.log(`Protocol: ${row.protocol}`);
      if (row.protocol === 'vless') {
        const stream = JSON.parse(row.stream_settings);
        const pbk = stream?.realitySettings?.settings?.publicKey;
        console.log(`Found VLESS PBK: ${pbk}`);
      }
    });
  });
});
