const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

exports.register = async (req, res) => {
  const { email, password, full_name } = req.body;
  
  try {
    // Check if user exists
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND is_deleted = 0`,
      [email]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Create user - ALWAYS as 'user' role for security
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role`,
      [email, password_hash, full_name, 'user']
    );
    
    const user = result.rows[0];
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, role 
       FROM users WHERE email = $1 AND is_deleted = 0`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await pool.query(
      `UPDATE users SET last_login = datetime('now') WHERE id = $1`,
      [user.id]
    );
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, role, created_at, last_login 
       FROM users WHERE id = $1 AND is_deleted = 0`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    // Soft delete user
    await pool.query(
      `UPDATE users SET is_deleted = 1, deleted_at = datetime('now') WHERE id = $1`,
      [req.user.id]
    );
    
    // Soft delete user's content
    await pool.query(
      `UPDATE content_submissions SET is_deleted = 1, deleted_at = datetime('now') 
       WHERE submitter_id = $1`,
      [req.user.id]
    );
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
