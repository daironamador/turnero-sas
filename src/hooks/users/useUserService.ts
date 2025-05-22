import { User, Service } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { createUserWithEmailPassword } from '@/services/authService';

export const fetchUsers = async (): Promise<{ users: User[], services: Service[] }> => {
  try {
    // Load services
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) {
      throw servicesError;
    }
    
    // Transform services data to match our Service type
    const transformedServices: Service[] = servicesData.map(data => ({
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      isActive: data.is_active,
      createdAt: new Date(data.created_at)
    }));
    
    // Load users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      throw usersError;
    }
    
    // Transform users data to match our User type
    const transformedUsers: User[] = usersData.map(data => ({
      id: data.id,
      username: data.username,
      name: data.name,
      email: data.email,
      role: (data.role as "admin" | "operator" | "viewer"),
      isActive: data.is_active,
      serviceIds: data.service_ids || [],
      services: transformedServices.filter(s => (data.service_ids || []).includes(s.id)),
      createdAt: new Date(data.created_at)
    }));
    
    return { users: transformedUsers, services: transformedServices };
  } catch (error: any) {
    console.error('Error loading user data:', error);
    throw error;
  }
};

// Additional functions for user management (update, create, toggle)
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
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
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const createUser = async (userData: Partial<User>, password: string): Promise<string> => {
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email || '',
      password: password,
      options: {
        data: {
          name: userData.name,
          username: userData.username,
          role: userData.role || 'operator',
          service_ids: userData.serviceIds || [],
          is_active: userData.isActive !== undefined ? userData.isActive : true,
        }
      }
    });
    
    if (authError) {
      console.error('Error creating user in Supabase Auth:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error('No user created in Supabase Auth');
    }
    
    return authData.user.id;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('El correo electrónico ya está en uso');
    }
    throw error;
  }
};

export const toggleUserActiveStatus = async (userId: string, newStatus: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', userId);
    
    if (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};
