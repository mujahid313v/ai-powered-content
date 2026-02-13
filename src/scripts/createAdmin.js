const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const full_name = process.argv[4] || 'Admin User';

  if (!email || !password) {
    console.error('Usage: node src/scripts/createAdmin.js <email> <password> [full_name]');
    console.error('Example: node src/scripts/createAdmin.js admin@example.com admin123 "Admin User"');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existing = await pool.query(
      `SELECT id, role FROM users WHERE email = $1 AND is_deleted = 0`,
      [email]
    );

    if (existing.rows.length > 0) {
      // Update existing user to moderator
      await pool.query(
        `UPDATE users SET role = 'moderator' WHERE email = $1`,
        [email]
      );
      console.log(`✓ User ${email} promoted to moderator`);
    } else {
      // Create new moderator
      const password_hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, 'moderator')`,
        [email, password_hash, full_name]
      );
      console.log(`✓ Moderator account created: ${email}`);
    }

    console.log('\nLogin credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: moderator`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
