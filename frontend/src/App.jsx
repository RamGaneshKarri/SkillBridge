import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import JoinBatch from './pages/JoinBatch';
import StudentDashboard from './pages/student/StudentDashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import InstitutionDashboard from './pages/institution/InstitutionDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import MonitorDashboard from './pages/monitor/MonitorDashboard';

// Root redirect based on role
const RootRedirect = () => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!currentUser) return <Navigate to="/login" replace />;

  const dashboardMap = {
    student: '/student',
    trainer: '/trainer',
    institution: '/institution',
    programme_manager: '/manager',
    monitoring_officer: '/monitor',
  };

  return <Navigate to={dashboardMap[userData?.role] || '/login'} replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/join" element={<JoinBatch />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Student routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/sessions" element={<StudentDashboard />} />
            <Route path="/student/attendance" element={<StudentDashboard />} />
          </Route>

          {/* Trainer routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/trainer/sessions" element={<TrainerDashboard />} />
            <Route path="/trainer/batches" element={<TrainerDashboard />} />
            <Route path="/trainer/attendance" element={<TrainerDashboard />} />
            <Route path="/trainer/invites" element={<TrainerDashboard />} />
          </Route>

          {/* Institution routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['institution']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/institution" element={<InstitutionDashboard />} />
            <Route path="/institution/batches" element={<InstitutionDashboard />} />
            <Route path="/institution/trainers" element={<InstitutionDashboard />} />
            <Route path="/institution/summary" element={<InstitutionDashboard />} />
          </Route>

          {/* Programme Manager routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['programme_manager']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/manager/institutions" element={<ManagerDashboard />} />
            <Route path="/manager/analytics" element={<ManagerDashboard />} />
          </Route>

          {/* Monitoring Officer routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['monitoring_officer']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/monitor" element={<MonitorDashboard />} />
            <Route path="/monitor/overview" element={<MonitorDashboard />} />
            <Route path="/monitor/analytics" element={<MonitorDashboard />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
