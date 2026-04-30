import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProtectedRoute: Guards routes by authentication and optionally by role.
 * - If not authenticated, redirects to /login
 * - If role doesn't match allowedRoles, redirects to appropriate dashboard
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying access..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!userData) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap = {
      student: '/student',
      trainer: '/trainer',
      institution: '/institution',
      programme_manager: '/manager',
      monitoring_officer: '/monitor',
    };
    return <Navigate to={dashboardMap[userData.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
