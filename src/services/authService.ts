
import { initializeFirebase } from '@/lib/firebase';

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    const auth = getAuth(app);
    
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const createUserWithEmailPassword = async (email: string, password: string) => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
    const auth = getAuth(app);
    
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error;
  }
};
