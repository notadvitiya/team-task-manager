=====================================================
  TEAM TASK MANAGER — Full-Stack Web Application
=====================================================

Live URL   : https://your-app.railway.app  (fill in after deploy)
GitHub     : https://github.com/your-username/team-task-manager
Tech Stack : React + Vite + Tailwind / Node.js + Express / PostgreSQL / JWT


-----------------------------------------------------
  WHAT THIS APP DOES
-----------------------------------------------------

A full-stack project management tool where teams can:
  - Sign up and log in securely (JWT authentication)
  - Create projects and invite team members
  - Create tasks with title, description, priority, assignee, and due date
  - Track task progress across three columns: To Do → In Progress → Done
  - See a dashboard with stats: total projects, tasks by status, overdue count

Role-based access control:
  - ADMIN  — can create/delete tasks, manage members, delete the project
  - MEMBER — can only update tasks assigned to them (change status, etc.)


-----------------------------------------------------
  PROJECT STRUCTURE
-----------------------------------------------------

team-task-manager/
  backend/
    src/
      index.js              ← Express server entry point
      db/
        pool.js             ← PostgreSQL connection
        init.js             ← Runs schema.sql on startup
        schema.sql          ← 4 tables: users, projects, project_members, tasks
      middleware/
        auth.js             ← JWT verification (protects routes)
        rbac.js             ← Role checks (admin vs member)
      routes/
        auth.js             ← POST /api/auth/signup  POST /api/auth/login
        projects.js         ← CRUD for projects + members
        tasks.js            ← CRUD for tasks (nested under projects)
        dashboard.js        ← GET /api/dashboard (summary stats)
    package.json
    railway.toml            ← Railway deployment config
    .env.example            ← Copy to .env and fill in values

  frontend/
    src/
      main.jsx              ← React entry point
      App.jsx               ← Routes setup
      api/
        client.js           ← Axios with JWT interceptor
      context/
        AuthContext.jsx     ← Global user state (useAuth hook)
      pages/
        Login.jsx           ← Login form
        Signup.jsx          ← Signup form
        Dashboard.jsx       ← Projects list + stats
        ProjectDetail.jsx   ← Task board (3 columns) + members
      components/
        Navbar.jsx          ← Top navigation bar
        TaskCard.jsx        ← Single task card
        TaskModal.jsx       ← Create/edit task modal
        StatusBadge.jsx     ← Colored status/priority pills
    vite.config.js
    tailwind.config.js
    package.json
    .env.example


-----------------------------------------------------
  HOW TO RUN LOCALLY
-----------------------------------------------------

1. CLONE AND SETUP
   git clone https://github.com/your-username/team-task-manager
   cd team-task-manager

2. SETUP POSTGRESQL
   Install PostgreSQL locally or use a free cloud DB (Supabase, Railway).
   Create a database called "taskmanager".

3. BACKEND SETUP
   cd backend
   npm install
   cp .env.example .env
   # Edit .env and set DATABASE_URL and JWT_SECRET
   npm run dev
   # Server starts on http://localhost:5000
   # Tables are created automatically on first run.

4. FRONTEND SETUP
   Open a new terminal:
   cd frontend
   npm install
   npm run dev
   # App opens on http://localhost:5173

5. USE THE APP
   Go to http://localhost:5173/signup
   Create an admin account, then create a project.
   Create another account (member), then add them to the project by email.


-----------------------------------------------------
  REST API ENDPOINTS
-----------------------------------------------------

AUTH
  POST   /api/auth/signup     Create account → returns JWT
  POST   /api/auth/login      Login → returns JWT
  GET    /api/auth/me         Get current user (requires JWT)

DASHBOARD
  GET    /api/dashboard       Summary stats for current user

PROJECTS
  GET    /api/projects        List all projects you're in
  POST   /api/projects        Create new project
  GET    /api/projects/:id    Get one project
  PUT    /api/projects/:id    Update project (admin only)
  DELETE /api/projects/:id    Delete project (admin only)

MEMBERS
  GET    /api/projects/:id/members              List members
  POST   /api/projects/:id/members              Add member by email (admin only)
  DELETE /api/projects/:id/members/:userId      Remove member (admin only)

TASKS
  GET    /api/projects/:id/tasks                List tasks (supports ?status=todo)
  POST   /api/projects/:id/tasks                Create task (admin only)
  PATCH  /api/projects/:id/tasks/:taskId        Update task
  DELETE /api/projects/:id/tasks/:taskId        Delete task (admin only)


-----------------------------------------------------
  HOW TO DEPLOY ON RAILWAY
-----------------------------------------------------

STEP 1: Push code to GitHub
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/your-username/team-task-manager
  git push -u origin main

STEP 2: Deploy Backend
  1. Go to railway.app → New Project → Deploy from GitHub repo
  2. Select your repo → choose the "backend" folder as root
  3. Railway auto-detects Node.js and runs "node src/index.js"
  4. Click "+ New" → Add PostgreSQL database to the same project
  5. Go to backend service → Variables tab → add:
       DATABASE_URL  = (copy the DATABASE_URL from the PostgreSQL service)
       JWT_SECRET    = (any long random string, e.g. "my-super-secret-32chars-key!")
       NODE_ENV      = production
       CLIENT_URL    = https://your-frontend.railway.app (set after frontend deploy)
  6. Backend deploys. Copy the URL (e.g. https://backend.railway.app)

STEP 3: Deploy Frontend
  1. In the same Railway project → "+ New Service" → GitHub repo
  2. Choose the "frontend" folder as root
  3. Set build command:  npm run build
  4. Set start command:  npx serve dist -s
     (or use Railway's static site deploy)
  5. Add variable:
       VITE_API_URL = https://your-backend.railway.app
  6. Redeploy. Copy the frontend URL.

STEP 4: Update backend CORS
  Go back to backend service → Variables → update:
    CLIENT_URL = https://your-frontend.railway.app

STEP 5: Test
  Visit your frontend URL. Sign up, create a project, add tasks. Done!

NOTE: Tables are created automatically when the backend starts for the first time.
      You do NOT need to manually run the SQL schema.


-----------------------------------------------------
  KEY DESIGN DECISIONS (for your video)
-----------------------------------------------------

1. JWT Authentication
   - User logs in → server signs a token with their ID, name, role
   - Frontend stores token in localStorage
   - Every request sends it as: Authorization: Bearer <token>
   - Server verifies signature using JWT_SECRET

2. Role-Based Access Control (RBAC)
   - Two levels: project-level admin and member
   - Same user can be admin of Project A and member of Project B
   - Middleware (rbac.js) checks the project_members table before allowing
     admin-only actions

3. Database Relationships
   - users → project_members ← projects   (many-to-many with role)
   - projects → tasks                     (one-to-many)
   - users → tasks (via assigned_to)      (one-to-many)
   - CASCADE deletes: deleting a project removes its tasks and memberships

4. Nested Routes for Tasks
   - Tasks live under projects: /api/projects/:projectId/tasks/:id
   - This keeps the API clean and ensures tasks are always scoped to a project

5. Frontend State
   - React Context (AuthContext) holds the logged-in user globally
   - useState + useEffect for data fetching (no extra libraries needed)
   - Axios interceptor auto-attaches JWT and handles 401s


-----------------------------------------------------
  DEMO VIDEO SCRIPT (2-5 min)
-----------------------------------------------------

0:00 - Show the signup page. Create an admin account.
0:30 - Dashboard overview. Show the stats cards (all 0 initially).
0:45 - Create a new project.
1:00 - Project detail page. Explain the 3-column task board.
1:15 - Create a task: set title, priority, due date.
1:45 - Create a second task and assign it to yourself.
2:00 - Open the Members panel. Add a second user by email.
2:20 - Show that the member role badge is different from admin.
2:35 - Log out. Log in as the member account.
2:50 - Member can see the project but has no "New Task" or "Delete" buttons.
3:10 - Member can open their assigned task and change the status to "In Progress".
3:25 - Back to admin. Show the task moved to the correct column.
3:40 - Dashboard shows updated task counts.
3:50 - Briefly show the Railway deployment URL (live app).
4:00 - Done!
