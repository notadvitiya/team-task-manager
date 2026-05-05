// middleware/auth.js
// This runs BEFORE any protected route handler.
// It checks the Authorization header for a valid JWT token.
// If valid → attaches the user info to req.user and continues.
// If invalid → sends 401 Unauthorized and stops.

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  // The frontend sends: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1]; // grab just the token part

  try {
    // jwt.verify checks the signature AND expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name, role }
    next(); // move on to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = requireAuth;
