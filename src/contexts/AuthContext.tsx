
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('viewer');

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // Set user role from metadata
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role || 'viewer');
        console.log('Session refreshed successfully:', session.user.email);
      }
    } catch (error) {
      console.error('Error getting session:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        await refreshUser();
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Setup subscription to auth changes with persistent session handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Update user role when auth state changes
        if (session?.user) {
          setUserRole(session.user.user_metadata?.role || 'viewer');
        } else {
          setUserRole('viewer');
        }
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
        
        setLoading(false);
      }
    );

    // Setup a periodic session check to prevent unexpected logouts
    const sessionCheckInterval = setInterval(async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
      } else if (data.session === null && session !== null) {
        // Session was lost unexpectedly
        console.warn('Session lost unexpectedly, attempting to recover');
        await refreshUser();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error signing out:', error);
      toast('Error al cerrar sesión');
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    refreshUser,
    userRole
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
