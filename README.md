# SkillBridge: Role-Based Attendance Management System

Welcome to the SkillBridge repository. If you are just joining the team, this document will give you a clear overview of what this project is, how the architecture is set up, and how you can get it running on your local machine.

## Project Overview

SkillBridge is a full-stack platform designed to manage attendance across state-level skilling programmes. The core complexity of this application lies in its multi-tenant, multi-role design. We have five distinct user roles that interact with the system in completely different ways. 

Our goal with this platform is to allow trainers and students to handle the day-to-day operations (like marking attendance and joining batches), while providing high-level, aggregated analytics to institutions and programme managers.

### The Five User Roles

To understand the codebase, you first need to understand who is using it. Here is how permissions are divided:

*   **Student**: The end-user. They can view the batches they are enrolled in, join new batches using secure invite links, and log their daily attendance.
*   **Trainer**: The ground-level operators. They are responsible for creating batches, generating invite links for students, creating daily sessions, and reviewing attendance logs.
*   **Institution**: The administrative layer. Institutions manage their trainers and have access to dashboard summaries to see how their specific batches are performing.
*   **Programme Manager**: The high-level overseer. They have access to system-wide analytics, allowing them to track performance across all institutions simultaneously.
*   **Monitoring Officer**: A strict read-only role. They can view the same high-level data as Programme Managers but cannot modify any records.

## Architecture and Design Decisions

We went with a MERN-like stack, but opted to lean heavily into Firebase for authentication and database management to reduce infrastructure overhead.

**Frontend:**
The client is built with React 19 and Vite 8, utilizing Tailwind CSS 4 for styling. We built a custom Role-Based Access Control (RBAC) layer into the frontend using a `ProtectedRoute` component that intercepts navigation attempts and verifies both authentication status and role access.

**Backend:**
The server is a standard Node.js and Express application. It acts as a middleman between the client and our Firestore database. We use the Firebase Admin SDK to interact with the database securely.

**Security Philosophy:**
We do not rely on the frontend for security. Every single API route is protected by token verification middleware. Furthermore, sensitive routes are wrapped in a `roleCheck` middleware. Even if a user manages to spoof their role on the frontend, the server will reject unauthorized database reads/writes.

## Repository Structure

The codebase is split into two main directories. Here is a quick map to help you navigate:

```text
SkillBridge/
├── backend/
│   ├── config/firebase.js     # Firebase Admin SDK initialization
│   ├── middleware/
│   │   ├── auth.js            # Intercepts and verifies Firebase ID tokens
│   │   └── roleCheck.js       # Ensures the user has the required role for the route
│   ├── routes/                # Express controllers split by domain (users, batches, sessions, etc.)
│   └── server.js              # Application entry point
├── frontend/
│   └── src/
│       ├── components/        # Reusable UI elements (Navbar, Sidebar, Layout)
│       ├── config/firebase.js # Firebase Client SDK initialization
│       ├── contexts/          # Contains our AuthContext for global state management
│       ├── pages/             # View layer, heavily separated by user roles
│       └── utils/api.js       # Axios instance with global auth interceptors
└── README.md
```

## Local Development Setup

To get the application running on your local machine, you will need Node.js installed and access to our Firebase project.

### 1. Start the Backend

1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. You will need the service account credentials. Ask a team lead for the `serviceAccountKey.json` file and place it in the root of the `backend/` directory, OR set the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable.
4. Start the development server: `npm run dev`

The backend should now be running on port 5000.

### 2. Start the Frontend

1. Open a new terminal and navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`

The frontend should now be running on port 5173.

### 3. API Routing Note

If you look at `frontend/src/utils/api.js`, you will notice we use an Axios instance. By default, it points to `http://localhost:5000/api`. If you ever need to test against the production database, you can override this by creating a `.env` file in the frontend directory and setting `VITE_API_URL`.

## Deployment

The application is currently configured for a split deployment:
*   **Backend:** Hosted on Render. It relies on the `FRONTEND_URL` environment variable to configure CORS properly.
*   **Frontend:** Hosted on Vercel. It requires a `vercel.json` file to handle SPA routing correctly, preventing 404 errors on direct navigation.

If you have any questions while getting set up, feel free to reach out to the team. Welcome aboard!
