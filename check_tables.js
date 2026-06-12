const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('x-ui.db');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
    if (err) throw err;
    tables.forEach(table => {
      db.all(`SELECT count(*) as count FROM ${table.name}`, (err, rows) => {
        console.log(`Table ${table.name} has ${rows[0].count} rows.`);
      });
    });
  });
});
