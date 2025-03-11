
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  userRole: string;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('viewer');

  const refreshUser = async () => {
    try {
      console.log('Refreshing user session...');
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        setLoading(false); // Ensure loading ends even on error
        return;
      }
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Set user role from metadata
      if (newSession?.user) {
        setUserRole(newSession.user.user_metadata?.role || 'viewer');
        console.log('Session refreshed successfully:', newSession.user.email, 'with role:', newSession.user.user_metadata?.role || 'viewer');
      } else {
        console.log('No session found during refresh');
      }
      
      setLoading(false); // End loading state after refresh completes
    } catch (error) {
      console.error('Error getting session:', error);
      setLoading(false); // Ensure loading ends even on error
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        await refreshUser();
      } catch (error) {
        console.error('Error getting session:', error);
        setLoading(false); // Ensure loading ends even on error
      }
    };

    getSession();

    // Setup subscription to auth changes with persistent session handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing session state');
          setSession(null);
          setUser(null);
          setUserRole('viewer');
        } else if (newSession) {
          console.log('New session detected, updating state');
          setSession(newSession);
          setUser(newSession.user);
          
          // Update user role when auth state changes
          if (newSession.user) {
            const role = newSession.user.user_metadata?.role || 'viewer';
            console.log('Setting user role:', role);
            setUserRole(role);
          }
        }
        
        // Handle token refresh events
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        setLoading(false); // Always end loading after any auth state change
      }
    );

    // Setup a periodic session check to prevent unexpected logouts
    const sessionCheckInterval = setInterval(async () => {
      // Only check if we believe we have a session and are not already loading
      if (session && !loading) {
        console.log('Performing periodic session check...');
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
          } else if (data.session === null && session !== null) {
            // Session was lost unexpectedly
            console.warn('Session lost unexpectedly, attempting to recover');
            await refreshUser();
          } else {
            console.log('Session check completed, session is valid');
          }
        } catch (error) {
          console.error('Error during session check:', error);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [session, loading]);

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      setLoading(true); // Start loading before signout
      await supabase.auth.signOut();
      setLoading(false); // End loading after signout
      toast('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false); // Ensure loading ends even on error
      toast('Error al cerrar sesión');
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    refreshUser,
    userRole,
    setSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
