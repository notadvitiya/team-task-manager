-- schema.sql
-- Run this once to create all your tables.
-- On Railway: open the PostgreSQL service → Data tab → run this SQL.

-- ─────────────────────────────────────────
-- 1. USERS TABLE
-- Stores everyone who signs up.
-- role = 'admin' means they can manage the whole app.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,          -- auto-incrementing number ID
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL, -- no duplicate emails
  password   VARCHAR(255) NOT NULL,        -- bcrypt hashed, never plain text
  role       VARCHAR(20) DEFAULT 'member', -- 'admin' or 'member'
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. PROJECTS TABLE
-- A project is a container for tasks.
-- created_by links back to the user who made it.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. PROJECT_MEMBERS TABLE
-- Who belongs to which project, and their role IN that project.
-- Same user can be admin in one project, member in another.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id)    ON DELETE CASCADE,
  role       VARCHAR(20) DEFAULT 'member',   -- 'admin' or 'member'
  joined_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)               -- can't join same project twice
);

-- ─────────────────────────────────────────
-- 4. TASKS TABLE
-- A task belongs to a project and can be assigned to a user.
-- status moves: todo → in_progress → done
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  DEFAULT 'todo',     -- 'todo', 'in_progress', 'done'
  priority    VARCHAR(20)  DEFAULT 'medium',   -- 'low', 'medium', 'high'
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT NOW()
);
