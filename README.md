# SkillBridge: Role-Based Attendance Management System

Welcome to the SkillBridge repository. This full-stack platform is designed to manage attendance across state-level skilling programmes, featuring a multi-tenant, multi-role architecture.

## 1. Live URLs

*   **Frontend (Live):** `https://skillbridge-attendance23pa5a1210.vercel.app/`
*   **Backend API (Live):** `https://skillbridge-1g6r.onrender.com`
*   **API Base URL:** `https://skillbridge-1g6r.onrender.com/api/health`

## 2. Test Accounts

Use the following credentials to explore the different Role-Based Access Control (RBAC) levels:

*   **Institution:**
    *   Email: `adityauniversity@gmail.com`
    *   Password: `Aditya@123`
*   **Trainer:**
    *   Email: `meghnasree@gmail.com`
    *   Password: `Meghna@123`
*   **Student:**
    *   Email: `sandeepnune@gmail.com`
    *   Password: `Sandeep@123`
*   **Programme Manager:**
    *   Email: `ramganeshkarri@gmail.com`
    *   Password: `Ganesh@123`
*   **Monitoring Officer:**
    *   Email: `sachinguthala@gmail.com`
    *   Password: `Sachin@123`

## 3. Setup Instructions (Local Development)

To run the application locally, you will need Node.js installed and access to the Firebase project for authentication and database services.

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Add the `serviceAccountKey.json` to the `backend/` directory, OR set the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable.
4. Start the server: `npm run dev` (Runs on `http://localhost:5000`)

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Set your `.env` variables if necessary (e.g., `VITE_API_URL=http://localhost:5000/api`).
4. Start the dev server: `npm run dev` (Runs on `http://localhost:5173`)

## 4. Schema Decisions

*   **NoSQL / Firestore:** Chose Firestore for its rapid prototyping capabilities and flexible schema definition.
*   **Denormalization:** Data is intentionally denormalized (e.g., embedding basic student info inside attendance records) to minimize the number of reads and improve query performance for dashboard aggregations.
*   **Hierarchical Structure:** The core relational flow is `Institutions -> Trainers -> Batches -> Sessions -> Attendance`. Since Firestore doesn't do joins, references (IDs) to parent documents are stored on child documents to facilitate querying.

## 5. Stack Choices

*   **Frontend (React 19, Vite 8, Tailwind CSS 4):** Chosen for a high-performance developer experience and rapid UI styling. The custom RBAC routing layer efficiently intercepts and handles role-based access.
*   **Backend (Node.js, Express):** Lightweight and highly customizable. It serves purely as an API and security middleware layer to interface with Firebase.
*   **Auth & Database (Firebase):** Diverged from a traditional SQL/JWT setup to use Firebase Authentication and Firestore. This significantly accelerated the development of secure authentication and token validation, while providing a scalable database out-of-the-box.

## 6. Project Status

*   **Fully Working:**
    *   Complete end-to-end multi-role authentication (RBAC).
    *   Secure route protection (frontend and backend).
    *   Batch creation, session management, and student attendance logging workflows.
*   **Partially Done:**
    *   High-level analytics dashboards for Programme Managers and Institutions (data is fetched and displayed, but visualizations and deep filtering are basic).
*   **Skipped:**
    *   Automated email notifications and PDF report generation due to project time constraints.

## 7. Future Improvements (What I would do differently)

With more time, **I would migrate the database to a relational SQL database (like PostgreSQL) using Prisma ORM.** While Firestore was excellent for speed and flexibility during initial development, the heavily relational nature of attendance tracking (Students -> Batches -> Sessions) inherently lends itself better to SQL joins. This would simplify complex analytics queries and guarantee stronger relational data integrity in the long run.

## 8. Architecture and Design Decisions

We went with a MERN-like stack, but opted to lean heavily into Firebase for authentication and database management to reduce infrastructure overhead.

**Security Philosophy:**
We do not rely on the frontend for security. Every single API route is protected by token verification middleware. Furthermore, sensitive routes are wrapped in a `roleCheck` middleware. Even if a user manages to spoof their role on the frontend, the server will reject unauthorized database reads/writes.

## 9. Repository Structure

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
