
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
    // Using the correct method for this version of Supabase client
    if (session) {
      // Instead of using updateSession, we'll set the session with the same token
      // This effectively refreshes the session with current settings
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
        // Get existing session first
        await refreshUser();
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Configure Supabase auth to use persisted auth storage
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      // Store auth session in localStorage for persistence
      if (session) {
        localStorage.setItem('supabase-auth-session', JSON.stringify(session));
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

    // Check for stored session on component mount
    const storedSession = localStorage.getItem('supabase-auth-session');
    if (storedSession && !session) {
      const parsedSession = JSON.parse(storedSession);
      supabase.auth.setSession({
        access_token: parsedSession.access_token,
        refresh_token: parsedSession.refresh_token,
      }).then(({ data }) => {
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setUserRole(data.session.user.user_metadata?.role || 'viewer');
        }
      }).catch((error) => {
        console.error('Error restoring session:', error);
        localStorage.removeItem('supabase-auth-session');
      });
    }

    return () => {
      // Cleanup auth subscription when component unmounts
      supabase.auth.onAuthStateChange(() => {});
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear persistence setting from localStorage when signing out
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
