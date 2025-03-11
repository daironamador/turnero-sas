
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

const AUTH_PERSISTENCE_KEY = 'auth-persistence';
const TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [isPersistent, setIsPersistent] = useState<boolean>(() => {
    const savedPersistence = localStorage.getItem(AUTH_PERSISTENCE_KEY);
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
        localStorage.setItem(TOKEN_KEY, currentSession.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, currentSession.refresh_token);
        
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
    localStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(isPersistent));
    setIsPersistent(isPersistent);
    
    // If there's an active session, ensure it persists according to the setting
    if (session) {
      if (isPersistent) {
        // Ensure session is stored in localStorage when persistence is enabled
        localStorage.setItem(TOKEN_KEY, session.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
      } else {
        // Clear from localStorage when persistence is disabled
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
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
          localStorage.setItem(TOKEN_KEY, currentSession.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, currentSession.refresh_token);
        } else {
          console.log('No active session found, checking localStorage...');
          // If no current session, try to restore from localStorage
          const storedToken = localStorage.getItem(TOKEN_KEY);
          const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          
          if (storedToken && storedRefreshToken) {
            console.log('Found tokens in localStorage, attempting to restore session...');
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: storedToken,
                refresh_token: storedRefreshToken,
              });
              
              if (error) {
                console.error('Error restoring session from localStorage:', error);
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
              } else if (data && data.session) {
                console.log('Session restored successfully from localStorage:', data.session.user.email);
                setSession(data.session);
                setUser(data.session.user);
                setUserRole(data.session.user.user_metadata?.role || 'viewer');
              }
            } catch (parseError) {
              console.error('Error restoring session from localStorage:', parseError);
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(REFRESH_TOKEN_KEY);
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
          localStorage.setItem(TOKEN_KEY, newSession.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, newSession.refresh_token);
        }
      }
      
      // Remove tokens from localStorage when user logs out
      if (event === 'SIGNED_OUT') {
        console.log('Removing session tokens from localStorage');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
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
    localStorage.removeItem(AUTH_PERSISTENCE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
