
import { useState, useEffect } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import { toast } from 'sonner';

export function useFirebaseAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [isPersistent, setPersistent] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  useEffect(() => {
    const initAuth = async () => {
      try {
        const app = await initializeFirebase();
        
        if (!app) {
          setLoading(false);
          return;
        }

        // Import Firebase auth
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const auth = getAuth(app);
        
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
          if (authUser) {
            // Get user claims to determine role
            authUser.getIdTokenResult().then((idTokenResult) => {
              const role = idTokenResult.claims.role || 'viewer';
              setUserRole(role);
              setUser(authUser);
              setLoading(false);
            }).catch(error => {
              console.error("Error getting token claims:", error);
              setUser(authUser);
              setUserRole('viewer'); // Default role
              setLoading(false);
            });
          } else {
            setUser(null);
            setUserRole('viewer');
            setLoading(false);
          }
        }, (authError) => {
          setError(authError ? authError.message : "Unknown auth error");
          setLoading(false);
        });
        
        return () => {
          unsubscribe();
        };
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const app = await initializeFirebase();
      if (!app) {
        throw new Error('Firebase not configured');
      }

      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      const auth = getAuth(app);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        toast.success('Inicio de sesión exitoso');
        return result.user;
      }
    } catch (err: any) {
      console.error('Error signing in:', err);
      
      // Translate Firebase error messages to Spanish
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'Usuario deshabilitado';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intente más tarde';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      const app = await initializeFirebase();
      if (!app) {
        throw new Error('Firebase not configured');
      }

      const { getAuth } = await import('firebase/auth');
      const auth = getAuth(app);
      
      await auth.signOut();
      toast.success('Sesión cerrada correctamente');
    } catch (err: any) {
      console.error('Error signing out:', err);
      toast.error('Error al cerrar sesión');
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const app = await initializeFirebase();
      if (!app) {
        return false;
      }

      const { getAuth } = await import('firebase/auth');
      const auth = getAuth(app);
      
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Force token refresh
        await currentUser.getIdToken(true);
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
    loading,
    error,
    signIn,
    signOut,
    refreshUser,
    userRole,
    session: user ? { user } : null, // Compatible with previous interface
    isPersistent,
    lastRefreshed
  };
}

export default useFirebaseAuth;
