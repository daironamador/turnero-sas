
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  allowedRoles = []
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocular-600"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is empty or user has the required role, render children
  // Note: Role checking is simplified here and would need to be expanded
  // based on how roles are actually stored in your system
  return <>{children}</>;
};

export default ProtectedRoute;
