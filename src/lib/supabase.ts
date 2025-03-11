
import { initSupabase } from './supabaseInit';
import { User, AuthError } from '@supabase/supabase-js';

// Initialize Supabase with persistent session storage (only once)
export const supabase = initSupabase();

// Function to create a new user
export const createUser = async (email: string, password: string, userData: any): Promise<{user: User | null, error: AuthError | null}> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          username: userData.username,
          role: userData.role,
          service_ids: userData.serviceIds
        }
      }
    });

    if (error) {
      console.error('Error al crear usuario:', error.message);
      return { user: null, error };
    }

    // If user creation is successful, create the record in the users table
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            service_ids: userData.serviceIds,
            is_active: true
          }
        ]);

      if (userError) {
        console.error('Error al crear registro de usuario:', userError.message);
        // If there's an error creating the record, delete the auth user
        await supabase.auth.admin.deleteUser(data.user.id);
        return { user: null, error: { name: 'Database Error', message: userError.message } as AuthError };
      }
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error inesperado al crear usuario:', error);
    return { user: null, error: { name: 'Unexpected Error', message: 'Error inesperado al crear usuario' } as AuthError };
  }
};

// Check if admin user exists, create if it doesn't
export const setupDefaultUser = async () => {
  try {
    const adminEmail = 'admin1@example.com';
    
    // Check if admin user exists by attempting to sign in
    const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: '123456'
    });
    
    // If there's a credential error, try to create the user
    if (userError && userError.message.includes('Invalid login credentials')) {
      console.log('Creando usuario administrador predeterminado...');
      const { user, error } = await createUser(adminEmail, '123456', {
        name: 'Administrador',
        username: 'admin1',
        role: 'admin',
        serviceIds: []
      });
      
      if (error) {
        console.error('Error al crear usuario predeterminado:', error.message);
      } else {
        console.log('Usuario administrador creado exitosamente');
      }
    } else if (!userError) {
      // If sign-in was successful, sign out
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error('Error al verificar/crear usuario predeterminado:', error);
  }
};

// Setup realtime subscriptions for tickets
export const setupRealtimeSubscriptions = () => {
  // Tickets subscription
  const ticketsSubscription = supabase
    .channel('tickets-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tickets' }, 
      (payload) => {
        console.log('Cambio en tickets recibido!', payload);
        window.dispatchEvent(new CustomEvent('tickets-updated', { 
          detail: payload 
        }));
      }
    )
    .subscribe();
    
  // Services subscription
  const servicesSubscription = supabase
    .channel('services-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'services' }, 
      payload => {
        console.log('Cambio en servicios recibido!', payload);
        window.dispatchEvent(new CustomEvent('services-updated', { detail: payload }));
      }
    )
    .subscribe();
    
  // Rooms subscription
  const roomsSubscription = supabase
    .channel('rooms-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'rooms' }, 
      payload => {
        console.log('Cambio en salas recibido!', payload);
        window.dispatchEvent(new CustomEvent('rooms-updated', { detail: payload }));
      }
    )
    .subscribe();

  // Cleanup function
  return () => {
    supabase.removeChannel(ticketsSubscription);
    supabase.removeChannel(servicesSubscription);
    supabase.removeChannel(roomsSubscription);
  };
};
