
import { CompanySettings } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export const getCompanySettings = async (): Promise<CompanySettings> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .single();
    
    if (error) {
      console.error('Error loading company settings:', error);
      // Return default settings in case of error
      return getDefaultSettings();
    }
    
    return {
      id: data.id,
      name: data.name || 'TOKEN ASSISTANT',
      address: data.address || 'Av. Principal #123, Ciudad',
      phone: data.phone || '(123) 456-7890',
      email: data.email || 'contacto@tokenassistant.com',
      logo: data.logo || '',
      ticketFooter: data.ticket_footer || 'Gracias por su visita. Por favor conserve este ticket.',
      displayMessage: data.display_message || 'Bienvenido a TOKEN ASSISTANT. Por favor espere a ser llamado.',
    };
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return getDefaultSettings();
  }
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<void> => {
  try {
    const { error } = await supabase
      .from('company_settings')
      .upsert({
        id: settings.id,
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        logo: settings.logo,
        ticket_footer: settings.ticketFooter,
        display_message: settings.displayMessage,
      });
    
    if (error) {
      throw error;
    }
    
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving company settings:', error);
    throw error;
  }
};

const getDefaultSettings = (): CompanySettings => {
  return {
    id: '1',
    name: 'TOKEN ASSISTANT',
    address: 'Av. Principal #123, Ciudad',
    phone: '(123) 456-7890',
    email: 'contacto@tokenassistant.com',
    logo: '',
    ticketFooter: 'Gracias por su visita. Por favor conserve este ticket.',
    displayMessage: 'Bienvenido a TOKEN ASSISTANT. Por favor espere a ser llamado.',
  };
};
