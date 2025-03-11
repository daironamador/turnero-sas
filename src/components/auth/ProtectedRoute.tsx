
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  allowedRoles = []
}) => {
  const { user, loading, refreshUser, userRole } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  // Attempt to refresh the user session when the component mounts, but only once
  useEffect(() => {
    const checkAndRefreshSession = async () => {
      if (!user && !refreshAttempted && !loading && !isRefreshing) {
        console.log('No user found, attempting to refresh session once');
        setIsRefreshing(true);
        try {
          await refreshUser();
        } catch (error) {
          console.error('Error refreshing user session:', error);
        } finally {
          setIsRefreshing(false);
          setRefreshAttempted(true);
        }
      }
    };
    
    checkAndRefreshSession();
  }, [user, refreshUser, refreshAttempted, loading, isRefreshing]);

  // Allow access to /display without authentication
  if (location.pathname === '/display') {
    return <>{children}</>;
  }

  // Show loading indicator only during initial auth check or session refresh
  if ((loading && !refreshAttempted) || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocular-600"></div>
      </div>
    );
  }

  // After refresh attempt completed, if user is still not logged in, redirect to login page
  if (!user) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check if role-based access control is needed
  if (user && allowedRoles.length > 0) {
    console.log('Checking user role:', userRole, 'against allowed roles:', allowedRoles);

    // Check if user has the required role
    if (!allowedRoles.includes(userRole)) {
      toast.error("No tienes permisos para acceder a esta sección");
      console.log(`Access denied: User role "${userRole}" not in allowed roles:`, allowedRoles);
      return <Navigate to="/" replace />;
    }
  }

  // If all checks pass, render children
  return <>{children}</>;
};

export default ProtectedRoute;
