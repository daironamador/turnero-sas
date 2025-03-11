
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { 
  storeAuthTokens, 
  getAuthTokens, 
  clearAuthTokens, 
  getPersistencePreference, 
  setPersistencePreference as setStoredPersistencePreference 
} from '@/lib/authUtils';
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
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.log('Session refreshed successfully:', currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        storeAuthTokens(currentSession.access_token, currentSession.refresh_token);
        
        if (currentSession?.user) {
          setUserRole(currentSession.user.user_metadata?.role || 'viewer');
        }
        return true;
      } else {
        const { accessToken, refreshToken } = getAuthTokens();
        
        if (accessToken && refreshToken) {
          console.log('Attempting to restore session from localStorage tokens...');
          
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error restoring session from tokens:', error);
              clearAuthTokens();
              return false;
            }
            
            if (data && data.session) {
              console.log('Session restored successfully from tokens:', data.session.user.email);
              setSession(data.session);
              setUser(data.session.user);
              setUserRole(data.session.user.user_metadata?.role || 'viewer');
              return true;
            }
          } catch (error) {
            console.error('Error in session recovery process:', error);
            clearAuthTokens();
          }
        }
        
        console.log('No session could be restored');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing user session:', error);
      return false;
    }
  };

  const setPersistence = (isPersistent: boolean) => {
    setStoredPersistencePreference(isPersistent);
    setIsPersistent(isPersistent);
    
    if (session) {
      if (isPersistent) {
        storeAuthTokens(session.access_token, session.refresh_token);
      } else {
        clearAuthTokens();
      }
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        console.log('Initializing auth session...');
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('Active session found:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          setUserRole(currentSession.user.user_metadata?.role || 'viewer');
          
          storeAuthTokens(currentSession.access_token, currentSession.refresh_token);
        } else {
          console.log('No active session found, checking localStorage...');
          
          const { accessToken, refreshToken } = getAuthTokens();
          
          if (accessToken && refreshToken) {
            console.log('Found tokens in localStorage, attempting to restore session...');
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('Error restoring session from localStorage:', error);
                clearAuthTokens();
              } else if (data && data.session) {
                console.log('Session restored successfully from localStorage:', data.session.user.email);
                setSession(data.session);
                setUser(data.session.user);
                setUserRole(data.session.user.user_metadata?.role || 'viewer');
                
                toast('Sesión restaurada automáticamente', {
                  description: 'Has iniciado sesión con tu sesión guardada.',
                  position: 'top-center',
                });
              }
            } catch (parseError) {
              console.error('Error restoring session from localStorage:', parseError);
              clearAuthTokens();
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.email);
      
      if (newSession) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log('Storing session tokens in localStorage due to event:', event);
          storeAuthTokens(newSession.access_token, newSession.refresh_token);
        }
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('Removing session tokens from localStorage');
        clearAuthTokens();
      }
      
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
      clearAuthTokens();
      setIsPersistent(false);
      
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
