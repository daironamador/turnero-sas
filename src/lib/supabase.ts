
import { createClient } from '@supabase/supabase-js';

// Asegurarnos que las credenciales estén definidas correctamente
const supabaseUrl = 'https://ymiohanwjypzkhjrtqlf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaW9oYW53anlwemtoanJ0cWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NzQ4MTksImV4cCI6MjA1NzE1MDgxOX0.ELDyIr-4-YPmciAtSAguD7HmdW31SgSkGchLpeIHqFI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan credenciales de Supabase. Por favor revise sus variables de entorno.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: '123456',
        options: {
          data: {
            role: 'admin'
          }
        }
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
