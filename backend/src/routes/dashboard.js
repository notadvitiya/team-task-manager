// routes/dashboard.js
// Returns summary data for the dashboard page.
// GET /api/dashboard
//
// Returns:
//   - Total projects you're in
//   - Total tasks assigned to you
//   - Tasks by status (todo, in_progress, done)
//   - Overdue tasks
//   - Recent activity (last 5 tasks updated)

const express     = require('express');
const pool        = require('../db/pool');
const requireAuth = require('../middleware/auth');
const router      = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    // Run all queries in parallel for speed
    const [projectsResult, tasksResult, overdueResult, recentResult] = await Promise.all([

      // Count of projects this user is in
      pool.query(
        'SELECT COUNT(*) FROM project_members WHERE user_id = $1',
        [userId]
      ),

      // Task counts by status (for tasks assigned to this user)
      pool.query(
        `SELECT status, COUNT(*) as count
         FROM tasks
         WHERE assigned_to = $1
         GROUP BY status`,
        [userId]
      ),

      // Overdue tasks assigned to this user
      pool.query(
        `SELECT t.id, t.title, t.due_date, t.priority, p.name as project_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.assigned_to = $1
           AND t.due_date < CURRENT_DATE
           AND t.status != 'done'
         ORDER BY t.due_date ASC
         LIMIT 5`,
        [userId]
      ),

      // Most recently created/updated tasks across all your projects
      pool.query(
        `SELECT t.id, t.title, t.status, t.priority, t.created_at,
                p.name as project_name,
                u.name as assigned_to_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
         LEFT JOIN users u ON u.id = t.assigned_to
         ORDER BY t.created_at DESC
         LIMIT 10`,
        [userId]
      )
    ]);

    // Convert task counts array into an object: { todo: 3, in_progress: 2, done: 5 }
    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    tasksResult.rows.forEach(row => {
      tasksByStatus[row.status] = parseInt(row.count);
    });

    res.json({
      totalProjects : parseInt(projectsResult.rows[0].count),
      tasksByStatus,
      totalTasks    : tasksByStatus.todo + tasksByStatus.in_progress + tasksByStatus.done,
      overdueTasks  : overdueResult.rows,
      recentTasks   : recentResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

module.exports = router;
