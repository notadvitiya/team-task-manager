================================================================================
                         TEAM TASK MANAGER
                     Full-Stack Web Application
================================================================================

LIVE APP    : https://team-task-manager-production-7654.up.railway.app
GITHUB REPO : https://github.com/notadvitiya/team-task-manager

================================================================================
FEATURES
================================================================================

- Authentication       : Signup & Login with JWT tokens, passwords hashed with bcrypt
- Role-Based Access    : Admins manage everything, Members update only their own tasks
- Project Management   : Create projects, invite members by email
- Task Management      : Create tasks with title, description, due date, priority, assignee
- Task Board           : Tasks grouped into To Do / In Progress / Done columns
- Dashboard            : Summary cards showing total tasks, overdue, and status breakdown

================================================================================
TECH STACK
================================================================================

Frontend   : React + Vite, Tailwind CSS, React Query, React Router
Backend    : Node.js, Express
Database   : PostgreSQL
Auth       : JWT + bcrypt
Deployment : Railway

================================================================================
PROJECT STRUCTURE
================================================================================

team-task-manager/
├── backend/
│   └── src/
│       ├── db/
│       │   ├── schema.sql        Database tables
│       │   ├── pool.js           PostgreSQL connection
│       │   └── init.js           Auto-runs schema on startup
│       ├── middleware/
│       │   ├── auth.js           JWT verification
│       │   └── rbac.js           Role-based access control
│       ├── routes/
│       │   ├── auth.js           Signup & Login
│       │   ├── projects.js       Project CRUD
│       │   ├── tasks.js          Task CRUD
│       │   └── dashboard.js      Dashboard stats
│       └── index.js              Express app entry point
└── frontend/
    └── src/
        ├── api/
        │   └── client.js         Axios instance with JWT interceptor
        ├── context/
        │   └── AuthContext.jsx   Global auth state
        ├── components/
        │   ├── Navbar.jsx
        │   ├── TaskCard.jsx
        │   ├── TaskModal.jsx
        │   └── StatusBadge.jsx
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── Dashboard.jsx
            └── ProjectDetail.jsx

================================================================================
LOCAL SETUP
================================================================================

PREREQUISITES
-------------
- Node.js v18+
- PostgreSQL 16
- Git

STEP 1 - Clone the repo
-----------------------
  git clone https://github.com/notadvitiya/team-task-manager.git
  cd team-task-manager

STEP 2 - Backend Setup
-----------------------
  cd backend
  npm install
  cp .env.example .env

Edit .env with your details:
  DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/taskmanager
  JWT_SECRET=any_long_random_string
  PORT=4000
  CLIENT_URL=http://localhost:5173

Create the database:
  createdb taskmanager

Start the backend:
  npm run dev

You should see:
  Connected to PostgreSQL
  Database tables ready
  Server running on port 4000

STEP 3 - Frontend Setup
------------------------
Open a new terminal:
  cd frontend
  npm install
  echo "VITE_API_URL=http://localhost:4000" > .env
  npm run dev

Open browser at: http://localhost:5173

================================================================================
DATABASE SCHEMA
================================================================================

users            : id, name, email, password, role
projects         : id, name, description, created_by
project_members  : project_id, user_id, role (admin/member)
tasks            : id, title, description, status, priority, due_date, assignee_id, project_id

================================================================================
API ENDPOINTS
================================================================================

METHOD   ENDPOINT                        DESCRIPTION                AUTH
------   -------                         -----------                ----
POST     /api/auth/signup                Register new user          Public
POST     /api/auth/login                 Login, returns JWT         Public
GET      /api/projects                   List user's projects       Required
POST     /api/projects                   Create project             Admin only
GET      /api/projects/:id/tasks         Get tasks for project      Required
POST     /api/projects/:id/tasks         Create task                Admin only
PATCH    /api/tasks/:id                  Update task                Required
POST     /api/projects/:id/members       Add member by email        Admin only
GET      /api/dashboard                  Dashboard stats            Required

================================================================================
DEPLOYMENT (RAILWAY)
================================================================================

- Backend deployed as Node.js service with root directory set to /backend
- PostgreSQL provisioned via Railway's managed database plugin
- Frontend deployed as static site with root directory set to /frontend

Backend Environment Variables on Railway:
  DATABASE_URL = (from Railway PostgreSQL plugin)
  JWT_SECRET   = (your secret string)
  PORT         = 4000
  NODE_ENV     = production

Frontend Environment Variables on Railway:
  VITE_API_URL = (your backend Railway URL)

================================================================================
AUTHOR
================================================================================

GitHub : https://github.com/notadvitiya/team-task-manager

================================================================================
