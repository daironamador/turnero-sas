
import { useState, useEffect } from 'react';
import { User, Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/lib/firebase';

export const useUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users and services from Firebase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
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
        
        setServices(transformedServices);
        setUsers(transformedUsers);
      } catch (error: any) {
        console.error('Error al cargar datos:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSaveUser = async (userData: Partial<User>, password?: string) => {
    try {
      const app = await initializeFirebase();
      
      if (!app) {
        throw new Error('Firebase not configured');
      }
      
      const { getFirestore, doc, setDoc, updateDoc, collection, addDoc, getAuth, createUserWithEmailAndPassword } = await import('firebase/firestore');
      const { getAuth: importGetAuth } = await import('firebase/auth');
      
      const db = getFirestore(app);
      const auth = importGetAuth(app);
      
      if (currentUser) {
        // Update existing user
        const userDocRef = doc(db, 'users', currentUser.id);
        
        await updateDoc(userDocRef, {
          username: userData.username,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          is_active: userData.isActive,
          service_ids: userData.serviceIds
        });
        
        // Update local state
        const updatedUsers = users.map(u => {
          if (u.id === currentUser.id) {
            const updatedUser = { 
              ...u, 
              ...userData,
              services: services.filter(s => (userData.serviceIds || []).includes(s.id))
            };
            return updatedUser;
          }
          return u;
        });
        
        setUsers(updatedUsers);
        toast({
          title: "Usuario actualizado",
          description: `Se ha actualizado el usuario ${userData.name}`,
        });
      } else {
        // Create new user with Firebase Auth
        if (!password) {
          throw new Error('Se requiere contraseña para crear un nuevo usuario');
        }
        
        try {
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, userData.email || '', password);
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
          
          // Add to local state
          const newUser: User = {
            id: userId,
            username: userData.username || '',
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'operator',
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            serviceIds: userData.serviceIds || [],
            services: services.filter(s => (userData.serviceIds || []).includes(s.id)),
            createdAt: new Date(now),
          };
          
          setUsers([...users, newUser]);
          toast({
            title: "Usuario creado",
            description: `Se ha creado el usuario ${newUser.name}`,
          });
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            toast({
              title: "Error",
              description: "El correo electrónico ya está en uso",
              variant: "destructive"
            });
          } else {
            throw error;
          }
        }
      }
      
      setIsDialogOpen(false);
      setCurrentUser(undefined);
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const app = await initializeFirebase();
      
      if (!app) {
        throw new Error('Firebase not configured');
      }
      
      const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
      const db = getFirestore(app);
      
      const user = users.find(u => u.id === id);
      if (!user) return;
      
      const newStatus = !user.isActive;
      
      // Update in database
      await updateDoc(doc(db, 'users', id), { 
        is_active: newStatus 
      });
      
      // Update in local state
      const updatedUsers = users.map(user => {
        if (user.id === id) {
          toast({
            title: newStatus ? "Usuario activado" : "Usuario desactivado",
            description: `Se ha ${newStatus ? 'activado' : 'desactivado'} el usuario ${user.name}`,
          });
          return { ...user, isActive: newStatus };
        }
        return user;
      });
      
      setUsers(updatedUsers);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (user: User) => {
    setCurrentUser(user);
    setIsDialogOpen(true);
  };

  const createUserDialog = () => {
    setCurrentUser(undefined);
    setIsDialogOpen(true);
  };

  return {
    users,
    services, 
    loading,
    error,
    isDialogOpen,
    currentUser,
    setIsDialogOpen,
    setCurrentUser,
    handleSaveUser,
    toggleUserStatus,
    openEditDialog,
    createUserDialog
  };
};
