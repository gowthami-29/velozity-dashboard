# Velozity Global Solutions — Real-Time Project Dashboard

A full-stack real-time project management dashboard built with React, TypeScript, Node.js, Express, PostgreSQL, Prisma and Socket.IO.

## Live Demo

Live Application: https://velozity-dashboard-beta.vercel.app/

GitHub Repository: https://github.com/gowthami-29/velozity-dashboard

## Features

* JWT authentication
* Access and refresh token authentication
* Refresh token stored in an HttpOnly cookie
* Role-based access control
* Admin, Project Manager and Developer roles
* Project management
* Task management
* Task status workflow
* Task priorities and due dates
* Activity history
* Real-time activity updates with Socket.IO
* Real-time notifications
* Persistent notifications
* Unread notification count
* Overdue task background job
* Dashboard statistics
* Dashboard status and priority filters
* Offline activity recovery from persisted activity logs
* Seed data for development and demonstration
* Responsive React dashboard

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide React
* Socket.IO Client

### Backend

* Node.js
* Express
* TypeScript
* JWT
* bcrypt
* Socket.IO
* Zod
* node-cron

### Database

* PostgreSQL
* Prisma ORM

## Project Structure

```text
velozity_dashboard/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── websocket/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── .env
│   └── package.json
│
└── README.md
```

## Roles and Permissions

### Admin

* View all projects
* View all tasks
* View global activity
* View users
* Access administrative settings
* Receive global real-time activity

### Project Manager

* View projects they manage
* Create and manage tasks within their projects
* View activity belonging to their projects
* Receive project-specific real-time updates

### Developer

* View tasks assigned to them
* Update status of their assigned tasks
* View activity related to their assigned tasks
* Receive relevant real-time notifications

Authorization is enforced at the API level. Frontend route protection is not used as the security boundary.

## Authentication

The application uses:

```text
Access Token
    ↓
Authorization: Bearer <token>
    ↓
API authentication middleware
    ↓
Role authorization middleware
```

Access tokens are short-lived.

Refresh tokens are stored server-side and delivered through an HttpOnly cookie.

When an access token expires, the frontend requests a new access token through:

```text
POST /api/auth/refresh
```

The frontend automatically retries the failed API request after successful refresh.

## Real-Time Architecture

Socket.IO is used for real-time communication.

Users authenticate their Socket.IO connection using the access token.

Users are placed into rooms such as:

```text
user:<userId>
role:ADMIN
project:<projectId>
```

Activity events are delivered according to the authenticated user's permissions.

Example flow:

```text
Task status change
       ↓
Database transaction
       ↓
ActivityLog created
       ↓
Notification created
       ↓
Socket.IO event
       ↓
Connected authorized users
```

When a user reconnects after being offline, the application loads the latest persisted activity records from the database.

## Background Jobs

Overdue tasks are checked using `node-cron`.

The scheduled job:

* Finds unfinished tasks whose due date has passed
* Creates an overdue notification
* Prevents duplicate overdue notifications
* Updates the developer's unread notification count
* Emits a real-time notification
* Emits a project-level overdue event

The job runs every five minutes.

## Dashboard

The dashboard provides:

* Total projects
* Total tasks
* Overdue tasks
* Tasks by status
* Status filtering
* Priority filtering

Example query parameters:

```text
/api/dashboard?status=IN_PROGRESS
```

```text
/api/dashboard?priority=HIGH
```

```text
/api/dashboard?status=IN_PROGRESS&priority=HIGH
```

All dashboard queries continue to respect backend RBAC.

## Database

Main entities:

```text
User
Client
Project
Task
ActivityLog
Notification
RefreshToken
```

Task statuses:

```text
TODO
IN_PROGRESS
IN_REVIEW
DONE
```

Task priorities:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

## Environment Variables

Create:

```text
server/.env
```

Example:

```env
DATABASE_URL="postgresql://postgres:1234567890@localhost:5432/velozity_dashboard"

JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

PORT=5000

CLIENT_URL="http://localhost:5173"
```



## Backend Setup

Open a terminal:

```bash
cd server
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

Seed the database:

```bash
npx prisma db seed
```

Start the backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

## Frontend Setup

Open another terminal:

```bash
cd client
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Seed Credentials

All seeded accounts use:

```text
password123
```

### Admin

```text
admin@velozity.com
```

### Project Managers

```text
pm1@velozity.com
pm2@velozity.com
```

### Developers

```text
dev1@velozity.com
dev2@velozity.com
dev3@velozity.com
dev4@velozity.com
```

The seed contains:

* 1 Admin
* 2 Project Managers
* 4 Developers
* 3 Projects
* 15 Tasks
* Multiple task statuses
* Multiple priorities
* At least 2 overdue unfinished tasks
* Existing activity history
* Sample notification

## Important API Routes

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
GET  /api/auth/me
```

### Dashboard

```text
GET /api/dashboard
```

### Projects

```text
GET  /api/projects
POST /api/projects
GET  /api/projects/:projectId
```

### Tasks

```text
GET   /api/tasks
POST  /api/tasks
PATCH /api/tasks/:taskId/status
```

### Activity

```text
GET /api/activity
```

The activity endpoint returns the latest persisted activity records allowed for the authenticated user.

### Notifications

```text
GET   /api/notifications
PATCH /api/notifications/:notificationId/read
```

## Security

Security controls include:

* Password hashing with bcrypt
* JWT verification
* Short-lived access tokens
* Refresh token rotation/validation
* HttpOnly refresh cookie
* API-level role authorization
* Ownership checks for projects and tasks
* Developer task ownership restrictions
* Project Manager project ownership restrictions
* Zod request validation
* No hardcoded production secrets
* Socket.IO authentication
* Socket.IO project access checks

## Development Commands

### Backend

```bash
npm run dev
```

```bash
npx tsc --noEmit
```

### Frontend

```bash
npm run dev
```

```bash
npm run build
```

## Production Considerations

Before production deployment:

1. Replace development JWT secrets.
2. Configure the production PostgreSQL connection.
3. Configure the production frontend URL.
4. Enable HTTPS.
5. Configure CORS for the production frontend domain.
6. Configure Socket.IO for the production environment.
7. Do not commit `.env` files.
8. Run Prisma migrations against the production database.
9. Seed only when appropriate for the target environment.

## Architecture Summary

```text
                 React + TypeScript
                        │
                        │ REST API
                        ▼
                Express + TypeScript
                        │
          ┌─────────────┴─────────────┐
          │                           │
      JWT/RBAC                    Prisma ORM
          │                           │
          │                           ▼
          │                       PostgreSQL
          │
          └────── Socket.IO ──────────┐
                                      │
                         Real-time clients
                                      │
                         Notifications
                         Activity events
```

