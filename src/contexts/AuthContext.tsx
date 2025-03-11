
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  userRole: string;
  setPersistence: (isPersistent: boolean) => void;
  isPersistent: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [isPersistent, setIsPersistent] = useState<boolean>(() => {
    // Check if persistence setting exists in localStorage
    const savedPersistence = localStorage.getItem('auth-persistence');
    return savedPersistence ? JSON.parse(savedPersistence) : true; // Default to true for persistence
  });

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // Set user role from metadata
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role || 'viewer');
      }
    } catch (error) {
      console.error('Error getting session:', error);
    }
  };

  const setPersistence = (isPersistent: boolean) => {
    // Save persistence setting to localStorage
    localStorage.setItem('auth-persistence', JSON.stringify(isPersistent));
    setIsPersistent(isPersistent);
    
    // Update session persistence setting in Supabase
    if (session) {
      // Use setSession instead of updateSession (which doesn't exist in this version)
      supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        // First try to get the session from Supabase (most reliable method)
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          // If we have a current valid session, use it
          setSession(currentSession);
          setUser(currentSession.user);
          setUserRole(currentSession.user.user_metadata?.role || 'viewer');
        } else {
          // If no current session, try to restore from localStorage
          const storedSession = localStorage.getItem('supabase-auth-session');
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            const { data, error } = await supabase.auth.setSession({
              access_token: parsedSession.access_token,
              refresh_token: parsedSession.refresh_token,
            });
            
            if (error) {
              console.error('Error restoring session:', error);
              localStorage.removeItem('supabase-auth-session');
            } else if (data && data.session) {
              setSession(data.session);
              setUser(data.session.user);
              setUserRole(data.session.user.user_metadata?.role || 'viewer');
            }
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Store session in localStorage for all events that have a valid session
      if (session) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log('Storing session in localStorage');
          localStorage.setItem('supabase-auth-session', JSON.stringify(session));
        }
      }
      
      // Remove session from localStorage when user logs out
      if (event === 'SIGNED_OUT') {
        console.log('Removing session from localStorage');
        localStorage.removeItem('supabase-auth-session');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Update user role when auth state changes
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role || 'viewer');
      } else {
        setUserRole('viewer');
      }
      
      setLoading(false);
    });

    return () => {
      // Cleanup auth subscription when component unmounts
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear stored data from localStorage when signing out
    localStorage.removeItem('auth-persistence');
    localStorage.removeItem('supabase-auth-session');
    setIsPersistent(false);
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    refreshUser,
    userRole,
    setPersistence,
    isPersistent
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
