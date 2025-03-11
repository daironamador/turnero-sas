
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { setPersistencePreference as setStoredPersistencePreference, getPersistencePreference } from '@/lib/authUtils';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<boolean>; 
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
  const [isPersistent, setIsPersistent] = useState<boolean>(getPersistencePreference());

  const refreshUser = async () => {
    try {
      console.log('Refreshing user session...');
      
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        console.log('Session active:', data.session.user.email);
        setSession(data.session);
        setUser(data.session.user);
        setUserRole(data.session.user.user_metadata?.role || 'viewer');
        return true;
      }
      
      console.log('No session found during refresh');
      return false;
    } catch (error) {
      console.error('Error refreshing user session:', error);
      return false;
    }
  };

  const setPersistence = (isPersistent: boolean) => {
    setStoredPersistencePreference(isPersistent);
    setIsPersistent(isPersistent);
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        console.log('Initializing auth session...');
        
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log('Active session found:', data.session.user.email);
          setSession(data.session);
          setUser(data.session.user);
          setUserRole(data.session.user.user_metadata?.role || 'viewer');
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error in session initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.email);
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        setUserRole(newSession.user.user_metadata?.role || 'viewer');
      } else {
        setUserRole('viewer');
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      toast('Sesión cerrada', {
        description: 'Has cerrado sesión exitosamente.',
        position: 'top-center',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast('Error al cerrar sesión', {
        description: 'Hubo un problema al cerrar tu sesión.',
        position: 'top-center'
      });
    }
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
