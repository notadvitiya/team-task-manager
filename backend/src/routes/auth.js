// routes/auth.js
// Handles user registration and login.
// POST /api/auth/signup  → create account, return JWT
// POST /api/auth/login   → verify credentials, return JWT

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db/pool');
const router   = express.Router();

// ─── SIGNUP ──────────────────────────────────────────────────────────────────
// Creates a new user account.
// Passwords are hashed with bcrypt (never stored as plain text).
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash the password. 10 = "salt rounds" (higher = slower but more secure)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Only allow 'admin' role if explicitly passed (for demo purposes)
    const userRole = role === 'admin' ? 'admin' : 'member';

    // Insert into DB
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email.toLowerCase(), hashedPassword, userRole]
    );

    const user = result.rows[0];

    // Create a JWT. It expires in 7 days.
    // The payload (id, email, name, role) is readable by the frontend.
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// Finds the user by email, compares the hashed password, returns JWT.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // bcrypt.compare hashes the input and checks it against the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without the password field
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
// Frontend can call this to verify their token is still valid.
const requireAuth = require('../middleware/auth');
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
