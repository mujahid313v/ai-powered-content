const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

async function migrate() {
  try {
    console.log('Running SQLite database migrations...');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create database
    const dbPath = path.join(dataDir, 'moderation.db');
    const db = new Database(dbPath);
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema-sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema);
    
    console.log('✓ Database created at:', dbPath);
    console.log('✓ All tables created successfully');
    
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
