
import { createClient } from '@supabase/supabase-js';
import { User, AuthError } from '@supabase/supabase-js';

// Asegurarnos que las credenciales estén definidas correctamente
const supabaseUrl = 'https://ymiohanwjypzkhjrtqlf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaW9oYW53anlwemtoanJ0cWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NzQ4MTksImV4cCI6MjA1NzE1MDgxOX0.ELDyIr-4-YPmciAtSAguD7HmdW31SgSkGchLpeIHqFI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan credenciales de Supabase. Por favor revise sus variables de entorno.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para crear un nuevo usuario
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

    // Si la creación es exitosa, crear el registro en la tabla de usuarios
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
        // Si hay error al crear el registro, eliminar el usuario de auth
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

// Comprueba si el usuario administrador existe, si no existe, lo crea
export const setupDefaultUser = async () => {
  try {
    const adminEmail = 'admin1@example.com';
    
    // Verificar si el usuario ya existe intentando iniciar sesión
    const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: '123456'
    });
    
    // Si hay un error de credenciales inválidas, intentamos crear el usuario
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
      // Si se pudo iniciar sesión, cerramos sesión para que el usuario inicie sesión manualmente
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error('Error al verificar/crear usuario predeterminado:', error);
  }
};

// Configuración de suscripciones en tiempo real para tickets
export const setupRealtimeSubscriptions = () => {
  // Suscripción a cambios en tickets
  const ticketsSubscription = supabase
    .channel('tickets-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tickets' }, 
      (payload) => {
        console.log('Cambio en tickets recibido!', payload);
        // Enviamos eventos que los componentes escucharán
        window.dispatchEvent(new CustomEvent('tickets-updated', { 
          detail: payload 
        }));
      }
    )
    .subscribe();
    
  // Suscripción a la tabla servicios
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
    
  // Suscripción a la tabla salas
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

  // Función de limpieza para eliminar las suscripciones
  return () => {
    supabase.removeChannel(ticketsSubscription);
    supabase.removeChannel(servicesSubscription);
    supabase.removeChannel(roomsSubscription);
  };
};
