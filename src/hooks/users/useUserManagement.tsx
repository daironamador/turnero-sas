
import { useState, useEffect } from 'react';
import { User, Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { fetchUsers, updateUser, createUser, toggleUserActiveStatus } from './useUserService';

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
        const { users: fetchedUsers, services: fetchedServices } = await fetchUsers();
        setServices(fetchedServices);
        setUsers(fetchedUsers);
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSaveUser = async (userData: Partial<User>, password?: string) => {
    try {
      if (currentUser) {
        // Update existing user
        await updateUser(currentUser.id, userData);
        
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
        // Create new user
        if (!password) {
          throw new Error('Se requiere contraseña para crear un nuevo usuario');
        }
        
        const userId = await createUser(userData, password);
        
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
          createdAt: new Date(),
        };
        
        setUsers([...users, newUser]);
        toast({
          title: "Usuario creado",
          description: `Se ha creado el usuario ${newUser.name}`,
        });
      }
      
      setIsDialogOpen(false);
      setCurrentUser(undefined);
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;
      
      const newStatus = !user.isActive;
      
      // Update in database
      await toggleUserActiveStatus(id, newStatus);
      
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
      console.error('Error changing status:', error);
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
