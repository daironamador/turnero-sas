
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const useFirebaseAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('');
  const [session, setSession] = useState<any>(null);
  const [isPersistent, setIsPersistent] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Get user claims to determine role
        currentUser.getIdTokenResult().then((idTokenResult) => {
          setUserRole(idTokenResult.claims.role || 'user');
        });
        
        setSession({ user: currentUser });
      } else {
        setUserRole('');
        setSession(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const refreshUser = async (): Promise<boolean> => {
    try {
      if (user) {
        // Force token refresh
        await user.getIdToken(true);
        setLastRefreshed(Date.now());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    loading,
    signOut,
    session,
    refreshUser,
    userRole,
    isPersistent,
    lastRefreshed
  };
};

export default useFirebaseAuth;
