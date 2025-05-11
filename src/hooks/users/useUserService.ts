
import { initializeFirebase } from '@/lib/firebase';
import { User, Service } from '@/lib/types';
import { createUserWithEmailPassword } from '@/services/authService';

export const fetchUsers = async (): Promise<{ users: User[], services: Service[] }> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Load services
    const servicesRef = collection(db, 'services');
    const servicesSnapshot = await getDocs(servicesRef);
    
    // Transform services data to match our Service type
    const transformedServices: Service[] = servicesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        isActive: data.is_active,
        createdAt: new Date(data.created_at)
      };
    });
    
    // Load users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    // Transform users data to match our User type
    const transformedUsers: User[] = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        name: data.name,
        email: data.email,
        role: (data.role as "admin" | "operator" | "viewer"),
        isActive: data.is_active,
        serviceIds: data.service_ids || [],
        services: transformedServices.filter(s => (data.service_ids || []).includes(s.id)),
        createdAt: new Date(data.created_at)
      };
    });
    
    return { users: transformedUsers, services: transformedServices };
  } catch (error: any) {
    console.error('Error loading user data:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Update user in Firestore
    await updateDoc(doc(db, 'users', userId), {
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      is_active: userData.isActive,
      service_ids: userData.serviceIds
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const createUser = async (userData: Partial<User>, password: string): Promise<string> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailPassword(userData.email || '', password);
    const userId = userCredential.user.uid;
    
    // Create user document in Firestore
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', userId), {
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'operator',
      is_active: userData.isActive !== undefined ? userData.isActive : true,
      service_ids: userData.serviceIds || [],
      created_at: now
    });
    
    return userId;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('El correo electrónico ya está en uso');
    }
    throw error;
  }
};

export const toggleUserActiveStatus = async (userId: string, newStatus: boolean): Promise<void> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Update in database
    await updateDoc(doc(db, 'users', userId), { 
      is_active: newStatus 
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};
