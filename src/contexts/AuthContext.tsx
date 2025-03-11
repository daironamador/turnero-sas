
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
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = async () => {
    // Prevent too frequent refreshes (minimum 5 seconds between refreshes)
    const now = Date.now();
    if (now - lastRefreshTime < 5000) {
      console.log('Skipping refresh - too soon since last refresh');
      return;
    }
    
    // Prevent concurrent refreshes
    if (isRefreshing) {
      console.log('Skipping refresh - already refreshing');
      return;
    }
    
    setIsRefreshing(true);
    setLastRefreshTime(now);
    
    try {
      console.log('Refreshing user session...');
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
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
        setUserRole('viewer');
      }
      
    } catch (error) {
      console.error('Error getting session:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isInitialLoad = true;
    
    const getSession = async () => {
      if (!isInitialLoad) return; // Only run during initial load
      
      setLoading(true);
      try {
        await refreshUser();
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
        isInitialLoad = false;
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
        
        setLoading(false);
      }
    );

    // Setup a periodic session check but only if we have a session
    const sessionCheckInterval = setInterval(async () => {
      // Only check if we believe we have a session and are not already loading or refreshing
      if (session && !loading && !isRefreshing) {
        console.log('Performing periodic session check...');
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
          } else if (data.session === null && session !== null) {
            // Session was lost unexpectedly
            console.warn('Session lost unexpectedly, attempting to recover');
            setRefreshCount(prev => prev + 1);
            if (refreshCount < 3) { // Limit refresh attempts to prevent infinite loops
              await refreshUser();
            } else {
              console.error('Maximum refresh attempts reached, clearing session');
              setSession(null);
              setUser(null);
            }
          } else {
            console.log('Session check completed, session is valid');
          }
        } catch (error) {
          console.error('Error during session check:', error);
        }
      }
    }, 15 * 60 * 1000); // Check every 15 minutes instead of 5

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [session, loading, refreshCount, isRefreshing]);

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      setLoading(true);
      await supabase.auth.signOut();
      setLoading(false);
      toast('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
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
