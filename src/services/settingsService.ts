
import { supabase } from '@/lib/supabase';
import { CompanySettings } from '@/lib/types';

export const getCompanySettings = async (): Promise<CompanySettings> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error al obtener la configuración de la empresa:', error);
      throw error;
    }
    
    return data as CompanySettings;
  } catch (error) {
    console.error('Error al obtener la configuración de la empresa:', error);
    // Devolver datos por defecto en caso de error
    return {
      id: '1',
      name: 'OcularClinic',
      address: 'Av. Principal #123, Ciudad',
      phone: '(123) 456-7890',
      email: 'contacto@ocularclinic.com',
      logo: '',
      ticketFooter: 'Gracias por su visita. Por favor conserve este ticket.',
      displayMessage: 'Bienvenido a OcularClinic. Por favor espere a ser llamado.',
    };
  }
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<void> => {
  try {
    const { error } = await supabase
      .from('company_settings')
      .upsert(settings, { onConflict: 'id' });
    
    if (error) {
      console.error('Error al guardar la configuración de la empresa:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al guardar la configuración de la empresa:', error);
    throw error;
  }
};
