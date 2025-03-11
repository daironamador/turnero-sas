
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
  const [isPersistent, setIsPersistent] = useState<boolean>(() => {
    const savedPersistence = localStorage.getItem('auth-persistence');
    return savedPersistence ? JSON.parse(savedPersistence) : true;
  });

  const refreshUser = async () => {
    try {
      console.log('Refreshing user session...');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.log('Session refreshed successfully:', currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Always store the session in localStorage for persistence
        localStorage.setItem('supabase.auth.token', currentSession.access_token);
        localStorage.setItem('supabase.auth.refresh_token', currentSession.refresh_token);
        
        // Set user role from metadata
        if (currentSession?.user) {
          setUserRole(currentSession.user.user_metadata?.role || 'viewer');
        }
        return true;
      } else {
        console.log('No active session found during refresh');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing user session:', error);
      return false;
    }
  };

  const setPersistence = (isPersistent: boolean) => {
    // Store persistence setting in localStorage
    localStorage.setItem('auth-persistence', JSON.stringify(isPersistent));
    setIsPersistent(isPersistent);
    
    // If there's an active session, ensure it persists according to the setting
    if (session) {
      if (isPersistent) {
        // Ensure session is stored in localStorage when persistence is enabled
        localStorage.setItem('supabase.auth.token', session.access_token);
        localStorage.setItem('supabase.auth.refresh_token', session.refresh_token);
      } else {
        // Clear from localStorage when persistence is disabled
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refresh_token');
      }
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        console.log('Initializing auth session...');
        
        // First try to get the session from Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('Active session found:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          setUserRole(currentSession.user.user_metadata?.role || 'viewer');
          
          // Always store tokens in localStorage for persistence
          localStorage.setItem('supabase.auth.token', currentSession.access_token);
          localStorage.setItem('supabase.auth.refresh_token', currentSession.refresh_token);
        } else {
          console.log('No active session found, checking localStorage...');
          // If no current session, try to restore from localStorage
          const storedToken = localStorage.getItem('supabase.auth.token');
          const storedRefreshToken = localStorage.getItem('supabase.auth.refresh_token');
          
          if (storedToken && storedRefreshToken) {
            console.log('Found tokens in localStorage, attempting to restore session...');
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: storedToken,
                refresh_token: storedRefreshToken,
              });
              
              if (error) {
                console.error('Error restoring session from localStorage:', error);
                localStorage.removeItem('supabase.auth.token');
                localStorage.removeItem('supabase.auth.refresh_token');
              } else if (data && data.session) {
                console.log('Session restored successfully from localStorage:', data.session.user.email);
                setSession(data.session);
                setUser(data.session.user);
                setUserRole(data.session.user.user_metadata?.role || 'viewer');
              }
            } catch (parseError) {
              console.error('Error restoring session from localStorage:', parseError);
              localStorage.removeItem('supabase.auth.token');
              localStorage.removeItem('supabase.auth.refresh_token');
            }
          } else {
            console.log('No stored tokens found in localStorage');
          }
        }
      } catch (error) {
        console.error('Error in session initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.email);
      
      // Store tokens in localStorage for events that have a valid session
      if (newSession) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log('Storing session tokens in localStorage due to event:', event);
          localStorage.setItem('supabase.auth.token', newSession.access_token);
          localStorage.setItem('supabase.auth.refresh_token', newSession.refresh_token);
        }
      }
      
      // Remove tokens from localStorage when user logs out
      if (event === 'SIGNED_OUT') {
        console.log('Removing session tokens from localStorage');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refresh_token');
      }
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Update user role when auth state changes
      if (newSession?.user) {
        setUserRole(newSession.user.user_metadata?.role || 'viewer');
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
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refresh_token');
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
