
import { useState, useEffect } from 'react';
import { User, Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { supabase, createUser } from '@/integrations/supabase/client';

export const useUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real users and services from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*');
          
        if (servicesError) {
          throw servicesError;
        }
        
        // Load users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');
          
        if (usersError) {
          throw usersError;
        }
        
        // Transform services data to match our Service type
        const transformedServices: Service[] = servicesData.map(service => ({
          id: service.id,
          code: service.code,
          name: service.name,
          description: service.description || undefined,
          isActive: service.is_active,
          createdAt: new Date(service.created_at)
        }));
        
        // Transform users data to match our User type
        const transformedUsers: User[] = usersData.map(user => ({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: (user.role as "admin" | "operator" | "viewer"),
          isActive: user.is_active,
          serviceIds: user.service_ids || [],
          services: transformedServices.filter(s => (user.service_ids || []).includes(s.id)),
          createdAt: new Date(user.created_at)
        }));
        
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
      if (currentUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            username: userData.username,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            is_active: userData.isActive,
            service_ids: userData.serviceIds
          })
          .eq('id', currentUser.id);
          
        if (error) throw error;
        
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
        // Create new user with auth
        if (!password) {
          throw new Error('Se requiere contraseña para crear un nuevo usuario');
        }
        
        const { user, error, message } = await createUser(
          userData.email || '',
          password,
          {
            name: userData.name,
            username: userData.username,
            role: userData.role,
            serviceIds: userData.serviceIds
          }
        );
        
        if (error) {
          // Special handling for email rate limit error
          if (error.name === 'EmailRateLimit') {
            toast({
              title: "Usuario creado con advertencia",
              description: error.message,
              variant: "default"
            });
            
            // Get the created user from the database to add to UI
            const { data: newUserData } = await supabase
              .from('users')
              .select('*')
              .eq('email', userData.email)
              .single();
              
            if (newUserData) {
              const newUser: User = {
                id: newUserData.id,
                username: newUserData.username,
                name: newUserData.name,
                email: newUserData.email,
                role: newUserData.role as 'admin' | 'operator' | 'viewer',
                isActive: newUserData.is_active,
                serviceIds: newUserData.service_ids || [],
                services: services.filter(s => (newUserData.service_ids || []).includes(s.id)),
                createdAt: new Date(newUserData.created_at),
              };
              
              setUsers([...users, newUser]);
              setIsDialogOpen(false);
              setCurrentUser(undefined);
              return;
            }
          } else {
            throw error;
          }
        }
        
        if (user) {
          // Add to local state
          const newUser: User = {
            id: user.id,
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
            description: message || `Se ha creado el usuario ${newUser.name}`,
          });
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
      const user = users.find(u => u.id === id);
      if (!user) return;
      
      const newStatus = !user.isActive;
      
      // Update in database
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
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
