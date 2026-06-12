const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('x-ui.db');

db.serialize(() => {
  db.all("PRAGMA table_info(client_traffics)", (err, rows) => {
    if (err) throw err;
    console.log("client_traffics columns:", rows.map(r => r.name));
  });
});
