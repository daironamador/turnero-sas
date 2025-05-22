
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [isPersistent, setPersistent] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Extract role from session metadata if available
        if (session?.user) {
          const role = session.user.app_metadata?.role || 'viewer';
          setUserRole(role);
        } else {
          setUserRole('viewer');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const role = session.user.app_metadata?.role || 'viewer';
        setUserRole(role);
      }
      
      setLoading(false);
    }).catch(error => {
      console.error("Error getting session:", error);
      setError("Error retrieving authentication session");
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        toast.success('Inicio de sesión exitoso');
        return data.user;
      }
    } catch (err: any) {
      console.error('Error signing in:', err);
      
      // Translate error messages to Spanish
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales inválidas';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Email no confirmado';
      } else if (err.message.includes('User not found')) {
        errorMessage = 'Usuario no encontrado';
      } else if (err.message.includes('rate limit')) {
        errorMessage = 'Demasiados intentos fallidos. Intente más tarde';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast.success('Sesión cerrada correctamente');
    } catch (err: any) {
      console.error('Error signing out:', err);
      toast.error('Error al cerrar sesión');
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        return false;
      }
      
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        setLastRefreshed(Date.now());
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error refreshing user:', err);
      return false;
    }
  };

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
    refreshUser,
    userRole,
    isPersistent,
    lastRefreshed
  };
}

export default useSupabaseAuth;
