# Team Task Manager

This is a full-stack project I built to understand how real-world team collaboration tools work. The idea was to create something similar to a simplified version of tools like Trello or Jira, where multiple users can work together on projects and track tasks.

## What it does

Users can create an account, log in, and start creating projects. Inside each project, tasks can be added, assigned to team members, and moved across different stages like "To Do", "In Progress", and "Done".

Each project also supports multiple members with different roles.

## Main features

- Authentication using JWT  
- Create and manage projects  
- Add members to a project  
- Role-based access:
  - Admin → full control
  - Member → can update assigned tasks  
- Task management:
  - title, description, priority, due date
  - assign tasks to users
  - update status  
- Basic dashboard showing task stats  

## Tech stack

Frontend:
- React (Vite)
- Tailwind CSS

Backend:
- Node.js
- Express

Database:
- PostgreSQL

Auth:
- JWT (JSON Web Tokens)

## How I structured it

I tried to keep backend and frontend separate.

Backend has:
- routes for auth, projects, tasks, dashboard
- middleware for authentication and role checks
- PostgreSQL for storing users, projects, tasks

Frontend has:
- pages like Login, Signup, Dashboard, Project view
- reusable components like task cards and modals
- a global auth context to manage user state

## Running locally
