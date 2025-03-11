
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
    return savedPersistence ? JSON.parse(savedPersistence) : false;
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed:', _event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Update user role when auth state changes
        if (session?.user) {
          setUserRole(session.user.user_metadata?.role || 'viewer');
        } else {
          setUserRole('viewer');
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear persistence setting from localStorage when signing out
    localStorage.removeItem('auth-persistence');
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
