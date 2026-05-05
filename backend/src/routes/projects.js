// routes/projects.js
// All project-related endpoints.
//
// GET    /api/projects            → list projects you belong to
// POST   /api/projects            → create a new project (you become admin)
// GET    /api/projects/:id        → get one project with members
// PUT    /api/projects/:id        → update project name/description (admin only)
// DELETE /api/projects/:id        → delete project (admin only)
// POST   /api/projects/:id/members        → add a member by email (admin only)
// DELETE /api/projects/:id/members/:userId → remove a member (admin only)
// GET    /api/projects/:id/members        → list members

const express    = require('express');
const pool       = require('../db/pool');
const requireAuth = require('../middleware/auth');
const { requireProjectAdmin, requireProjectMember } = require('../middleware/rbac');
const router     = express.Router();

// All project routes require login
router.use(requireAuth);

// ─── LIST MY PROJECTS ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Get all projects where the current user is a member
    const result = await pool.query(
      `SELECT p.*, pm.role as my_role,
              COUNT(DISTINCT t.id) as task_count,
              COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as done_count,
              COUNT(DISTINCT CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN t.id END) as overdue_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id, pm.role
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// ─── CREATE PROJECT ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  // Use a transaction: both inserts must succeed or neither does
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create the project
    const projectResult = await client.query(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), description || '', req.user.id]
    );
    const project = projectResult.rows[0];

    // 2. Automatically add the creator as admin of this project
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [project.id, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...project, my_role: 'admin' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create project.' });
  } finally {
    client.release();
  }
});

// ─── GET ONE PROJECT ──────────────────────────────────────────────────────────
router.get('/:id', requireProjectMember, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pm.role as my_role
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
       WHERE p.id = $1`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// ─── UPDATE PROJECT ───────────────────────────────────────────────────────────
router.put('/:id', requireProjectAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
      [name.trim(), description || '', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// ─── DELETE PROJECT ───────────────────────────────────────────────────────────
router.delete('/:id', requireProjectAdmin, async (req, res) => {
  try {
    // CASCADE in schema handles deleting tasks and memberships too
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// ─── GET MEMBERS ──────────────────────────────────────────────────────────────
router.get('/:id/members', requireProjectMember, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, u.name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
});

// ─── ADD MEMBER ───────────────────────────────────────────────────────────────
// Admin provides an email address. We look up the user and add them.
router.post('/:id/members', requireProjectAdmin, async (req, res) => {
  const { email, role } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // Find user by email
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No user found with that email. They must sign up first.' });
    }

    const newMember = userResult.rows[0];
    const memberRole = role === 'admin' ? 'admin' : 'member';

    // Add them (ON CONFLICT does nothing if they're already a member)
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
      [req.params.id, newMember.id, memberRole]
    );

    res.status(201).json({ ...newMember, role: memberRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member.' });
  }
});

// ─── REMOVE MEMBER ────────────────────────────────────────────────────────────
router.delete('/:id/members/:userId', requireProjectAdmin, async (req, res) => {
  // Can't remove yourself
  if (parseInt(req.params.userId) === req.user.id) {
    return res.status(400).json({ error: 'You cannot remove yourself from a project.' });
  }

  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

module.exports = router;
