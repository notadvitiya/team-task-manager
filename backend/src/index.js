// src/index.js
// The main entry point. This starts the Express server.
// All routes are imported and mounted here.

require('dotenv').config(); // load .env variables FIRST before anything else

const express    = require('express');
const cors       = require('cors');
const initDB     = require('./db/init');

// Import route files
const authRoutes      = require('./routes/auth');
const projectRoutes   = require('./routes/projects');
const taskRoutes      = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
// CORS: Allow the frontend (different port/domain) to talk to this server
app.use(cors({
  origin: process.env.CLIENT_URL || '*', // '*' allows any origin (fine for dev/demo)
  credentials: true
}));

// Parse incoming JSON bodies so req.body works
app.use(express.json());

// Simple request logger so you can see what's hitting the server
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
// Every route below is prefixed with /api

app.use('/api/auth',      authRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Task routes are NESTED under projects: /api/projects/:projectId/tasks
// mergeParams:true in tasks.js lets it read :projectId
app.use('/api/projects/:projectId/tasks', taskRoutes);

// Health check endpoint — Railway uses this to verify the app is running
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler — catches any unhandled errors
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
async function start() {
  await initDB(); // create tables if they don't exist
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start();
