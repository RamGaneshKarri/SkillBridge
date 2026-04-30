# SkillBridge — Role-Based Attendance Management System

A full-stack attendance management platform for state-level skilling programmes, supporting **5 distinct user roles** with real-time data, role-based access control, and a modern responsive interface.

## 🎯 Project Overview

SkillBridge enables institutions, trainers, and students to manage attendance across batches and sessions — while programme managers and monitoring officers gain oversight through aggregated summaries and analytics.

### User Roles

| Role | Capabilities |
|------|-------------|
| **Student** | View enrolled batches, join via invite links, mark attendance (present/absent/late) |
| **Trainer** | Create batches & sessions, generate invite links, view per-session attendance |
| **Institution** | Manage batches & trainers, view attendance summaries with progress indicators |
| **Programme Manager** | Oversee all institutions, view cross-institution analytics & programme-wide summary |
| **Monitoring Officer** | Read-only access to programme-wide data (no create/edit actions) |

## 🏗️ Architecture

```
Frontend (React + Vite + Tailwind CSS)
    ↓ Firebase Auth (ID Token)
Backend (Express.js + Firebase Admin SDK)
    ↓ Verified Token + Role Check
Database (Cloud Firestore)
```

**Key design decision:** Firebase provides a unified platform for auth and database, reducing integration complexity and eliminating the need for a separate database service. Server-side role verification on every API call ensures security is not just frontend gating.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | Node.js, Express.js |
| Database | Cloud Firestore |
| Auth | Firebase Authentication (Email/Password) |
| Deployment | Vercel (frontend) + Render (backend) |

## 📁 Project Structure

```
SkillBridge/
├── backend/
│   ├── server.js              # Express entry point
│   ├── config/firebase.js     # Firebase Admin SDK init
│   ├── middleware/
│   │   ├── auth.js            # Token verification middleware
│   │   └── roleCheck.js       # Role-based access control
│   └── routes/
│       ├── users.js           # User registration & profile
│       ├── batches.js         # Batch CRUD, invite, join
│       ├── sessions.js        # Session management
│       ├── attendance.js      # Mark & view attendance
│       └── summary.js         # Aggregated analytics
├── frontend/
│   └── src/
│       ├── config/firebase.js # Firebase client SDK
│       ├── contexts/AuthContext.jsx
│       ├── components/        # Layout, Navbar, Sidebar, ProtectedRoute
│       ├── pages/
│       │   ├── Login.jsx & Signup.jsx
│       │   ├── JoinBatch.jsx
│       │   ├── student/StudentDashboard.jsx
│       │   ├── trainer/TrainerDashboard.jsx
│       │   ├── institution/InstitutionDashboard.jsx
│       │   ├── manager/ManagerDashboard.jsx
│       │   └── monitor/MonitorDashboard.jsx
│       └── utils/api.js       # Axios with auth interceptor
├── CONTACT.txt
└── README.md
```

## 🔐 Firestore Schema

```
users/{uid}
  - name, email, role, institutionId, createdAt

batches/{batchId}
  - name, institutionId, trainerIds[], studentIds[], createdAt

sessions/{sessionId}
  - batchId, trainerId, title, date, startTime, endTime, createdAt

attendance/{attendanceId}
  - sessionId, studentId, status ("present"|"absent"|"late"), markedAt

invites/{inviteId}
  - batchId, token (unique), createdBy, used, createdAt
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Auth & Firestore enabled
- Firebase Admin SDK service account key

### Backend Setup

```bash
cd backend
npm install

# Configure .env (see .env.example)
# Add your Firebase service account credentials:
#   FIREBASE_PROJECT_ID=your-project-id
#   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
#   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

npm run dev    # starts on port 5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev    # starts on port 5173
```

### Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** authentication
3. Create a **Firestore database**
4. Generate a **service account key** (Project Settings → Service Accounts)
5. Add the service account credentials to `backend/.env`
6. Update `frontend/src/config/firebase.js` with your web app config

## 🔒 Security

- **Server-side token verification** on every API request (Firebase Admin SDK)
- **Role-based middleware** — API endpoints are guarded by `requireRole()` middleware
- **Frontend route protection** — `ProtectedRoute` component enforces auth + role
- **No direct Firestore access** from frontend — all data goes through the Express API
- **Invite tokens** are single-use with UUID v4 for batch joining

## 📡 API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/users/me` | ✅ | All | Get current user profile |
| POST | `/api/batches` | ✅ | Trainer, Institution | Create batch |
| POST | `/api/batches/:id/invite` | ✅ | Trainer | Generate invite link |
| POST | `/api/batches/:id/join` | ✅ | Student | Join batch via token |
| POST | `/api/sessions` | ✅ | Trainer | Create session |
| GET | `/api/sessions/:id/attendance` | ✅ | Trainer | View session attendance |
| POST | `/api/attendance/mark` | ✅ | Student | Mark attendance |
| GET | `/api/summary/batch/:id` | ✅ | Institution+ | Batch summary |
| GET | `/api/summary/programme` | ✅ | PM, MO | Programme-wide summary |

## 🎨 UI Features

- **Glassmorphic navbar** with role badges
- **Role-based sidebar** with dynamic navigation
- **Responsive design** — works on desktop & mobile
- **Smooth animations** — fade-in, slide-in transitions
- **Modern form styling** with validation feedback
- **Toast notifications** for all user actions
- **Split-screen auth pages** with gradient branding

## 👤 Contact

See [CONTACT.txt](./CONTACT.txt) for submission details.
