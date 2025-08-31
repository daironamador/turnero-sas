import { supabase } from '@/lib/supabase';
import { Ticket, ServiceType } from '@/lib/types';
import { Database } from '@/lib/database.types';

// Type for Supabase ticket row
type SupabaseTicketRow = Database['public']['Tables']['tickets']['Row'];

// Helper function to convert Supabase ticket data to our Ticket type
const convertSupabaseTicket = (data: SupabaseTicketRow): Ticket => {
  return {
    id: data.id,
    ticketNumber: data.ticket_number,
    serviceType: data.service_type as ServiceType,
    status: data.status,
    isVip: data.is_vip,
    createdAt: new Date(data.created_at),
    calledAt: data.called_at ? new Date(data.called_at) : undefined,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    counterNumber: data.counter_number,
    patientName: data.patient_name,
    redirectedTo: data.redirected_to,
    redirectedFrom: data.redirected_from,
    previousTicketNumber: data.previous_ticket_number,
  };
};

// Alias function for backward compatibility
export const createTicket = async (
  serviceType: ServiceType,
  isVip: boolean,
  patientName?: string
): Promise<Ticket | null> => {
  return generateTicket(serviceType, isVip, patientName);
};

// Get tickets by status
export const getTicketsByStatus = async (status: string): Promise<Ticket[]> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error(`Error getting ${status} tickets:`, error);
      return [];
    }
    
    return data.map(convertSupabaseTicket);
  } catch (error) {
    console.error(`Error getting ${status} tickets:`, error);
    return [];
  }
};

// Generate new ticket
export const generateTicket = async (
  serviceType: ServiceType,
  isVip: boolean,
  patientName?: string
): Promise<Ticket | null> => {
  try {
    // Get the last ticket number for this service type
    const { data: lastTicket, error: lastTicketError } = await supabase
      .from('tickets')
      .select('ticket_number')
      .eq('service_type', serviceType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results
    
    // Generate new ticket number
    const prefix = serviceType.substring(0, 1).toUpperCase();
    let nextNumber = 1;
    
    if (lastTicket && lastTicket.ticket_number && typeof lastTicket.ticket_number === 'string') {
      const numberPart = lastTicket.ticket_number.substring(1);
      const parsedNumber = parseInt(numberPart, 10);
      if (!isNaN(parsedNumber)) {
        nextNumber = parsedNumber + 1;
      }
    }
    
    const ticketNumber = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    
    // Create the new ticket
    const newTicket = {
      ticket_number: ticketNumber,
      service_type: serviceType,
      status: 'waiting',
      is_vip: isVip,
      created_at: new Date().toISOString(),
      patient_name: patientName || null,
      counter_number: null,
      called_at: null,
      completed_at: null,
      redirected_to: null,
      redirected_from: null,
      previous_ticket_number: null,
    };
    
    // Add to database
    const { data, error } = await supabase
      .from('tickets')
      .insert(newTicket)
      .select()
      .single();
    
    if (error) {
      console.error('Error generating ticket:', error);
      return null;
    }
    
    // Return the created ticket
    return {
      id: data.id,
      ticketNumber,
      serviceType,
      status: 'waiting',
      isVip,
      createdAt: new Date(),
      patientName: patientName,
    };
  } catch (error) {
    console.error('Error generating ticket:', error);
    return null;
  }
};

// Call a ticket
export const callTicket = async (ticketId: string, counterNumber: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'serving',
        counter_number: counterNumber,
        called_at: new Date().toISOString()
      })
      .eq('id', ticketId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error calling ticket:', error);
    throw new Error('No se pudo llamar al ticket');
  }
};

// Complete a ticket
export const completeTicket = async (ticketId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', ticketId);
    
    if (error) {
      console.error('Error completing ticket:', error);
      throw new Error('No se pudo completar el ticket');
    }
    
    return true;
  } catch (error) {
    console.error('Error completing ticket:', error);
    throw new Error('No se pudo completar el ticket');
  }
};

// Cancel a ticket
export const cancelTicket = async (ticketId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', ticketId);
    
    if (error) {
      console.error('Error cancelling ticket:', error);
      throw new Error('No se pudo cancelar el ticket');
    }
    
    return true;
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    throw new Error('No se pudo cancelar el ticket');
  }
};

// Redirect a ticket
export const redirectTicket = async (ticketId: string, newServiceType: ServiceType): Promise<boolean> => {
  try {
    // Get current ticket
    const { data: currentTicket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      throw new Error('No se pudo obtener el ticket');
    }
    
    if (!currentTicket) {
      throw new Error('El ticket no existe');
    }
    
    // Generate new ticket number for the redirected service
    const { data: lastTicket } = await supabase
      .from('tickets')
      .select('ticket_number')
      .eq('service_type', newServiceType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to handle no results
    
    const prefix = newServiceType.substring(0, 1).toUpperCase();
    let nextNumber = 1;
    
    if (lastTicket && lastTicket.ticket_number && typeof lastTicket.ticket_number === 'string') {
      const numberPart = lastTicket.ticket_number.substring(1);
      const parsedNumber = parseInt(numberPart, 10);
      if (!isNaN(parsedNumber)) {
        nextNumber = parsedNumber + 1;
      }
    }
    
    const newTicketNumber = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    
    // Create new ticket
    const newTicket = {
      ticket_number: newTicketNumber,
      service_type: newServiceType,
      status: 'waiting',
      is_vip: currentTicket.is_vip,
      created_at: new Date().toISOString(),
      patient_name: currentTicket.patient_name,
      counter_number: null,
      called_at: null,
      completed_at: null,
      redirected_to: null,
      redirected_from: currentTicket.service_type,
      previous_ticket_number: currentTicket.ticket_number,
    };
    
    // Add new ticket to Supabase
    const { error: insertError } = await supabase
      .from('tickets')
      .insert(newTicket);
    
    if (insertError) {
      console.error('Error creating redirected ticket:', insertError);
      throw new Error('No se pudo crear el ticket redirigido');
    }
    
    // Update original ticket as redirected
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'redirected',
        completed_at: new Date().toISOString(),
        redirected_to: newServiceType
      })
      .eq('id', ticketId);
    
    if (updateError) {
      console.error('Error updating original ticket:', updateError);
      throw new Error('No se pudo actualizar el ticket original');
    }
    
    return true;
  } catch (error) {
    console.error('Error redirecting ticket:', error);
    throw new Error('No se pudo redirigir el ticket');
  }
};

// Recall a ticket
export const recallTicket = async (ticketId: string, counterNumber: string): Promise<boolean> => {
  try {
    // Get current ticket
    const { data: currentTicket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      throw new Error('No se pudo obtener el ticket');
    }
    
    if (!currentTicket) {
      throw new Error('El ticket no existe');
    }
    
    // Create new ticket with same number but serving status
    const newTicket = {
      ticket_number: currentTicket.ticket_number,
      service_type: currentTicket.service_type,
      status: 'serving',
      is_vip: currentTicket.is_vip,
      created_at: new Date().toISOString(),
      called_at: new Date().toISOString(),
      completed_at: null,
      counter_number: counterNumber,
      patient_name: currentTicket.patient_name,
      redirected_to: null,
      redirected_from: null,
      previous_ticket_number: null,
    };
    
    // Add new ticket to Supabase
    const { error: insertError } = await supabase
      .from('tickets')
      .insert(newTicket);
    
    if (insertError) {
      console.error('Error recalling ticket:', insertError);
      throw new Error('No se pudo rellamar al ticket');
    }
    
    return true;
  } catch (error) {
    console.error('Error recalling ticket:', error);
    throw new Error('No se pudo rellamar al ticket');
  }
};

// Get tickets for reports
export const getTicketsReport = async (startDate: Date, endDate: Date): Promise<Ticket[]> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (error) {
      console.error('Error getting ticket report:', error);
      return [];
    }
    
    return data.map(convertSupabaseTicket);
  } catch (error) {
    console.error('Error getting ticket report:', error);
    return [];
  }
};

// Get report by period
export const getReportByPeriod = async (period: string): Promise<Ticket[]> => {
  try {
    const now = new Date();
    let startDate: Date;
    
    switch(period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly': {
        // Set to Monday of current week
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      }
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    return await getTicketsReport(startDate, now);
  } catch (error) {
    console.error(`Error getting ${period} report:`, error);
    return [];
  }
};

// New function for stats
export const getTodayStats = async () => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Query all tickets from today
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());
    
    if (error) {
      console.error('Error getting today stats:', error);
      return {
        total: 0,
        waiting: 0,
        serving: 0,
        completed: 0,
        cancelled: 0,
        redirected: 0
      };
    }
    
    // Count tickets by status
    const total = data.length;
    const waiting = data.filter(t => t.status === 'waiting').length;
    const serving = data.filter(t => t.status === 'serving').length;
    const completed = data.filter(t => t.status === 'completed').length;
    const cancelled = data.filter(t => t.status === 'cancelled').length;
    const redirected = data.filter(t => t.status === 'redirected').length;
    
    return {
      total,
      waiting,
      serving,
      completed,
      cancelled,
      redirected
    };
  } catch (error) {
    console.error('Error getting today stats:', error);
    return {
      total: 0,
      waiting: 0,
      serving: 0,
      completed: 0,
      cancelled: 0,
      redirected: 0
    };
  }
};
