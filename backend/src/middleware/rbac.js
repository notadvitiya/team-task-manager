// middleware/rbac.js
// Role-Based Access Control.
// Used on routes that only project admins can access (delete, add members, etc.)
//
// Usage in a route file:
//   router.delete('/:id', requireAuth, requireProjectAdmin, handler)

const pool = require('../db/pool');

async function requireProjectAdmin(req, res, next) {
  const projectId = req.params.id || req.params.projectId;
  const userId    = req.user.id;

  try {
    // Check if this user is an admin in this project
    const result = await pool.query(
      `SELECT role FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    if (result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only project admins can do this.' });
    }

    next(); // user is an admin → allow through
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error checking permissions.' });
  }
}

// Just checks membership (admin OR member) — used for viewing project data
async function requireProjectMember(req, res, next) {
  const projectId = req.params.id || req.params.projectId;
  const userId    = req.user.id;

  try {
    const result = await pool.query(
      `SELECT role FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    req.projectRole = result.rows[0].role; // pass role along for later checks
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error checking membership.' });
  }
}

module.exports = { requireProjectAdmin, requireProjectMember };
