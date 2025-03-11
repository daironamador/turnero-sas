
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  allowedRoles = []
}) => {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // On component mount, try to refresh the user session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check if there's a valid session
        const { data } = await supabase.auth.getSession();
        if (!data.session && localStorage.getItem('supabase-auth-session')) {
          // If we have a stored session but no active session, try to refresh
          await refreshUser();
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [refreshUser]);

  // Allow access to /display without authentication
  if (location.pathname === '/display') {
    return <>{children}</>;
  }

  // Show loading indicator while checking auth state
  if (loading || isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocular-600"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login page with return URL
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check if role-based access control is needed
  if (allowedRoles.length > 0) {
    // Get user role from auth metadata
    const userRole = user.user_metadata?.role || 'viewer';

    // Check if user has the required role
    if (!allowedRoles.includes(userRole)) {
      toast.error("No tienes permisos para acceder a esta sección");
      return <Navigate to="/" replace />;
    }
  }

  // If allowedRoles is empty or user has the required role, render children
  return <>{children}</>;
};

export default ProtectedRoute;
