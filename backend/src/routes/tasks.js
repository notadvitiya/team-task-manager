// routes/tasks.js
// Task management endpoints.
//
// GET    /api/projects/:projectId/tasks       → list all tasks in a project
// POST   /api/projects/:projectId/tasks       → create a task (admin only)
// PATCH  /api/projects/:projectId/tasks/:id   → update task (status, assignee, etc.)
// DELETE /api/projects/:projectId/tasks/:id   → delete task (admin only)

const express     = require('express');
const pool        = require('../db/pool');
const requireAuth = require('../middleware/auth');
const { requireProjectAdmin, requireProjectMember } = require('../middleware/rbac');
const router      = express.Router({ mergeParams: true }); // mergeParams lets us read :projectId

// All task routes require login
router.use(requireAuth);

// ─── LIST TASKS ───────────────────────────────────────────────────────────────
router.get('/', requireProjectMember, async (req, res) => {
  const { status, assigned_to } = req.query; // optional filters

  try {
    // Build query with optional filters
    let query = `
      SELECT t.*,
             u_assigned.name as assigned_to_name,
             u_assigned.email as assigned_to_email,
             u_created.name as created_by_name
      FROM tasks t
      LEFT JOIN users u_assigned ON u_assigned.id = t.assigned_to
      LEFT JOIN users u_created  ON u_created.id  = t.created_by
      WHERE t.project_id = $1
    `;
    const params = [req.params.projectId];

    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    if (assigned_to) {
      params.push(assigned_to);
      query += ` AND t.assigned_to = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// ─── CREATE TASK ──────────────────────────────────────────────────────────────
// Only project admins can create tasks
router.post('/', requireProjectAdmin, async (req, res) => {
  const { title, description, assigned_to, due_date, priority, status } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  // Validate status
  const validStatuses = ['todo', 'in_progress', 'done'];
  const taskStatus = validStatuses.includes(status) ? status : 'todo';

  // Validate priority
  const validPriorities = ['low', 'medium', 'high'];
  const taskPriority = validPriorities.includes(priority) ? priority : 'medium';

  try {
    // If assigned_to is provided, make sure that person is in the project
    if (assigned_to) {
      const memberCheck = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [req.params.projectId, assigned_to]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, created_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.params.projectId,
        title.trim(),
        description || '',
        taskStatus,
        taskPriority,
        assigned_to || null,
        req.user.id,
        due_date || null
      ]
    );

    // Return task with assignee name
    const task = result.rows[0];
    if (task.assigned_to) {
      const userResult = await pool.query(
        'SELECT name, email FROM users WHERE id = $1',
        [task.assigned_to]
      );
      task.assigned_to_name  = userResult.rows[0]?.name;
      task.assigned_to_email = userResult.rows[0]?.email;
    }

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// ─── UPDATE TASK ──────────────────────────────────────────────────────────────
// Both admins and members can update tasks (members can change status of their own tasks)
router.patch('/:id', requireProjectMember, async (req, res) => {
  const { title, description, status, priority, assigned_to, due_date } = req.body;

  try {
    // Get the existing task first
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND project_id = $2',
      [req.params.id, req.params.projectId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = taskResult.rows[0];

    // Members can only update tasks assigned to them
    // Admins can update any task
    if (req.projectRole === 'member' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you.' });
    }

    // Build update query dynamically (only update provided fields)
    const validStatuses   = ['todo', 'in_progress', 'done'];
    const validPriorities = ['low', 'medium', 'high'];

    const updates = [];
    const params  = [];

    if (title !== undefined) {
      params.push(title.trim());
      updates.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${params.length}`);
    }
    if (status !== undefined && validStatuses.includes(status)) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (priority !== undefined && validPriorities.includes(priority)) {
      params.push(priority);
      updates.push(`priority = $${params.length}`);
    }
    if (assigned_to !== undefined) {
      params.push(assigned_to || null);
      updates.push(`assigned_to = $${params.length}`);
    }
    if (due_date !== undefined) {
      params.push(due_date || null);
      updates.push(`due_date = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    // Attach assignee name
    const updated = result.rows[0];
    if (updated.assigned_to) {
      const userResult = await pool.query(
        'SELECT name, email FROM users WHERE id = $1',
        [updated.assigned_to]
      );
      updated.assigned_to_name  = userResult.rows[0]?.name;
      updated.assigned_to_email = userResult.rows[0]?.email;
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// ─── DELETE TASK ──────────────────────────────────────────────────────────────
router.delete('/:id', requireProjectAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND project_id = $2 RETURNING id',
      [req.params.id, req.params.projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ message: 'Task deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
