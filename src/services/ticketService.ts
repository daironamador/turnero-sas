
import { supabase } from '@/lib/supabase';
import { ServiceType, Ticket } from '@/lib/types';
import { format } from 'date-fns';

// Get today's tickets
export const getTodayTickets = async (): Promise<Ticket[]> => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (error) {
    console.error('Error fetching today tickets:', error);
    throw error;
  }

  return data.map(mapDatabaseTicketToTicket);
};

// Get tickets by status
export const getTicketsByStatus = async (status: string): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('status', status);

  if (error) {
    console.error('Error fetching tickets by status:', error);
    throw error;
  }

  return data.map(mapDatabaseTicketToTicket);
};

// Generate sequential ticket number
export const generateTicketNumber = async (serviceType: ServiceType): Promise<string> => {
  // Get today's tickets for this service type to find the highest number
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  const { data, error } = await supabase
    .from('tickets')
    .select('ticket_number')
    .eq('service_type', serviceType)
    .gte('created_at', startOfDay)
    .order('ticket_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error generating ticket number:', error);
    throw error;
  }

  let nextNumber = 1;
  
  if (data && data.length > 0) {
    // Extract the number part and increment
    const lastTicket = data[0].ticket_number;
    const numberPart = parseInt(lastTicket.substring(2), 10);
    nextNumber = isNaN(numberPart) ? 1 : numberPart + 1;
  }

  // Format with leading zeros (001, 002, etc.)
  return `${serviceType}${nextNumber.toString().padStart(3, '0')}`;
};

// Create a new ticket
export const createTicket = async (serviceType: ServiceType, isVip: boolean): Promise<Ticket> => {
  const ticketNumber = await generateTicketNumber(serviceType);
  
  const newTicket = {
    id: crypto.randomUUID(),
    ticket_number: ticketNumber,
    service_type: serviceType,
    status: 'waiting',
    is_vip: isVip,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert([newTicket])
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }

  return mapDatabaseTicketToTicket(data);
};

// Update a ticket's status
export const updateTicketStatus = async (id: string, status: string, updates: any = {}): Promise<Ticket> => {
  const ticketUpdate = {
    status,
    ...updates,
  };

  const { data, error } = await supabase
    .from('tickets')
    .update(ticketUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }

  return mapDatabaseTicketToTicket(data);
};

// Call a ticket (change status to serving)
export const callTicket = async (id: string, counterNumber: number): Promise<Ticket> => {
  return updateTicketStatus(id, 'serving', { 
    called_at: new Date().toISOString(),
    counter_number: counterNumber 
  });
};

// Complete a ticket
export const completeTicket = async (id: string): Promise<Ticket> => {
  return updateTicketStatus(id, 'completed', { 
    completed_at: new Date().toISOString() 
  });
};

// Cancel a ticket
export const cancelTicket = async (id: string): Promise<Ticket> => {
  return updateTicketStatus(id, 'cancelled', { 
    completed_at: new Date().toISOString() 
  });
};

// Redirect a ticket
export const redirectTicket = async (
  id: string, 
  targetServiceType: ServiceType
): Promise<{ oldTicket: Ticket, newTicket: Ticket }> => {
  // Get the current ticket
  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching ticket for redirect:', fetchError);
    throw fetchError;
  }
  
  // Create a new ticket number for the redirected service
  const newTicketNumber = await generateTicketNumber(targetServiceType);
  
  // Create the new redirected ticket
  const newTicket = {
    id: crypto.randomUUID(),
    ticket_number: newTicketNumber,
    service_type: targetServiceType,
    status: 'waiting',
    is_vip: currentTicket.is_vip,
    created_at: new Date().toISOString(),
    redirected_from: currentTicket.service_type,
    previous_ticket_number: currentTicket.ticket_number,
  };
  
  // Insert the new ticket
  const { data: createdTicket, error: createError } = await supabase
    .from('tickets')
    .insert([newTicket])
    .select()
    .single();
  
  if (createError) {
    console.error('Error creating redirected ticket:', createError);
    throw createError;
  }
  
  // Update the original ticket
  const { data: updatedTicket, error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'redirected',
      completed_at: new Date().toISOString(),
      redirected_to: targetServiceType
    })
    .eq('id', id)
    .select()
    .single();
  
  if (updateError) {
    console.error('Error updating original ticket:', updateError);
    throw updateError;
  }
  
  return {
    oldTicket: mapDatabaseTicketToTicket(updatedTicket),
    newTicket: mapDatabaseTicketToTicket(createdTicket)
  };
};

// Helper to map database fields to our local types
function mapDatabaseTicketToTicket(dbTicket: any): Ticket {
  return {
    id: dbTicket.id,
    ticketNumber: dbTicket.ticket_number,
    serviceType: dbTicket.service_type as ServiceType,
    status: dbTicket.status as 'waiting' | 'serving' | 'completed' | 'cancelled' | 'redirected',
    isVip: dbTicket.is_vip,
    createdAt: new Date(dbTicket.created_at),
    calledAt: dbTicket.called_at ? new Date(dbTicket.called_at) : undefined,
    completedAt: dbTicket.completed_at ? new Date(dbTicket.completed_at) : undefined,
    counterNumber: dbTicket.counter_number,
    patientName: dbTicket.patient_name,
    redirectedTo: dbTicket.redirected_to as ServiceType | undefined,
    redirectedFrom: dbTicket.redirected_from as ServiceType | undefined,
    previousTicketNumber: dbTicket.previous_ticket_number,
  };
}

// Get statistics for today's tickets
export const getTodayStats = async () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  // Get counts of tickets by status for today
  const { data: waitingData, error: waitingError } = await supabase
    .from('tickets')
    .select('count', { count: 'exact' })
    .eq('status', 'waiting')
    .gte('created_at', startOfDay);

  const { data: servingData, error: servingError } = await supabase
    .from('tickets')
    .select('count', { count: 'exact' })
    .eq('status', 'serving')
    .gte('created_at', startOfDay);

  const { data: completedData, error: completedError } = await supabase
    .from('tickets')
    .select('count', { count: 'exact' })
    .eq('status', 'completed')
    .gte('created_at', startOfDay);

  const { data: cancelledData, error: cancelledError } = await supabase
    .from('tickets')
    .select('count', { count: 'exact' })
    .eq('status', 'cancelled')
    .gte('created_at', startOfDay);

  if (waitingError || servingError || completedError || cancelledError) {
    console.error('Error fetching ticket stats');
    throw new Error('Could not fetch ticket statistics');
  }

  return {
    waiting: waitingData?.[0]?.count || 0,
    serving: servingData?.[0]?.count || 0,
    completed: completedData?.[0]?.count || 0,
    cancelled: cancelledData?.[0]?.count || 0,
    total: (waitingData?.[0]?.count || 0) + 
           (servingData?.[0]?.count || 0) + 
           (completedData?.[0]?.count || 0) + 
           (cancelledData?.[0]?.count || 0)
  };
};

// Get reports data by time range
export const getTicketsReport = async (
  startDate: Date, 
  endDate: Date
): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets report:', error);
    throw error;
  }

  return data.map(mapDatabaseTicketToTicket);
};
