const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/moderation.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Convert PostgreSQL placeholders ($1, $2) to SQLite (?, ?)
function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\$\d+/g, () => '?');
}

// Wrapper to make it compatible with pg pool interface
const pool = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      try {
        const convertedSql = convertPlaceholders(sql);
        
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          const stmt = db.prepare(convertedSql);
          const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
          resolve({ rows });
        } else if (sql.trim().toUpperCase().startsWith('BEGIN') || 
                   sql.trim().toUpperCase().startsWith('COMMIT') || 
                   sql.trim().toUpperCase().startsWith('ROLLBACK')) {
          db.exec(convertedSql);
          resolve({ rows: [] });
        } else {
          const stmt = db.prepare(convertedSql);
          const info = params.length > 0 ? stmt.run(...params) : stmt.run();
          resolve({ rows: [{ id: info.lastInsertRowid }], rowCount: info.changes });
        }
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = pool;
