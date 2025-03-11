
import { supabase } from '@/lib/supabase';
import { ServiceType, Ticket } from '@/lib/types';
import { format } from 'date-fns';

// Obtener tickets de hoy
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
    console.error('Error al obtener tickets de hoy:', error);
    throw error;
  }

  return data.map(mapDatabaseTicketToTicket);
};

// Obtener tickets por estado
export const getTicketsByStatus = async (status: string): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('status', status);

  if (error) {
    console.error('Error al obtener tickets por estado:', error);
    throw error;
  }

  return data.map(mapDatabaseTicketToTicket);
};

// Generar número de ticket secuencial
export const generateTicketNumber = async (serviceType: ServiceType): Promise<string> => {
  // Obtener tickets de hoy para este tipo de servicio para encontrar el número más alto
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data, error } = await supabase
    .from('tickets')
    .select('ticket_number')
    .eq('service_type', serviceType)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay)
    .order('ticket_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error generando número de ticket:', error);
    throw error;
  }

  let nextNumber = 1;
  
  if (data && data.length > 0) {
    // Extraer la parte numérica e incrementar
    const lastTicket = data[0].ticket_number;
    const numberPart = parseInt(lastTicket.substring(2), 10);
    nextNumber = isNaN(numberPart) ? 1 : numberPart + 1;
  }

  // Formatear con ceros a la izquierda (001, 002, etc.)
  return `${serviceType}${nextNumber.toString().padStart(3, '0')}`;
};

// Crear un nuevo ticket
export const createTicket = async (serviceType: ServiceType, isVip: boolean, patientName?: string): Promise<Ticket> => {
  const ticketNumber = await generateTicketNumber(serviceType);
  
  const newTicket = {
    ticket_number: ticketNumber,
    service_type: serviceType,
    status: 'waiting',
    is_vip: isVip,
    patient_name: patientName || null
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert([newTicket])
    .select()
    .single();

  if (error) {
    console.error('Error al crear ticket:', error);
    throw error;
  }

  return mapDatabaseTicketToTicket(data);
};

// Actualizar el estado de un ticket
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
    console.error('Error al actualizar ticket:', error);
    throw error;
  }

  return mapDatabaseTicketToTicket(data);
};

// Llamar a un ticket (cambiar estado a serving)
export const callTicket = async (id: string, counterNumber: string): Promise<Ticket> => {
  return updateTicketStatus(id, 'serving', { 
    called_at: new Date().toISOString(),
    counter_number: counterNumber 
  });
};

// Completar un ticket
export const completeTicket = async (id: string): Promise<Ticket> => {
  return updateTicketStatus(id, 'completed', { 
    completed_at: new Date().toISOString() 
  });
};

// Cancelar un ticket
export const cancelTicket = async (id: string): Promise<Ticket> => {
  return updateTicketStatus(id, 'cancelled', { 
    completed_at: new Date().toISOString() 
  });
};

// Redirigir un ticket
export const redirectTicket = async (
  id: string, 
  targetServiceType: ServiceType,
  patientName?: string
): Promise<{ oldTicket: Ticket, newTicket: Ticket }> => {
  // Obtener el ticket actual
  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error al obtener ticket para redirigir:', fetchError);
    throw fetchError;
  }
  
  // Instead of creating a new ticket number, we'll preserve the original ticket number
  const originalTicketNumber = currentTicket.ticket_number;
  
  // Crear el nuevo ticket redirigido
  const newTicket = {
    ticket_number: originalTicketNumber, // Keep original ticket number
    service_type: targetServiceType,
    status: 'waiting',
    is_vip: currentTicket.is_vip,
    patient_name: patientName || currentTicket.patient_name,
    redirected_from: currentTicket.service_type,
    previous_ticket_number: currentTicket.ticket_number,
  };
  
  // Insertar el nuevo ticket
  const { data: createdTicket, error: createError } = await supabase
    .from('tickets')
    .insert([newTicket])
    .select()
    .single();
  
  if (createError) {
    console.error('Error al crear ticket redirigido:', createError);
    throw createError;
  }
  
  // Actualizar el ticket original
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
    console.error('Error al actualizar ticket original:', updateError);
    throw updateError;
  }
  
  return {
    oldTicket: mapDatabaseTicketToTicket(updatedTicket),
    newTicket: mapDatabaseTicketToTicket(createdTicket)
  };
};

// Función auxiliar para mapear campos de la base de datos a nuestros tipos locales
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

// Obtener estadísticas de los tickets de hoy
export const getTodayStats = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  // Obtener conteos de tickets por estado para hoy
  const { data: waitingData, error: waitingError, count: waitingCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'waiting')
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  const { data: servingData, error: servingError, count: servingCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'serving')
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  const { data: completedData, error: completedError, count: completedCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  const { data: cancelledData, error: cancelledError, count: cancelledCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (waitingError || servingError || completedError || cancelledError) {
    console.error('Error getting statistics:', waitingError || servingError || completedError || cancelledError);
    throw new Error('No se pudieron obtener las estadísticas de tickets');
  }

  return {
    waiting: waitingCount || 0,
    serving: servingCount || 0,
    completed: completedCount || 0,
    cancelled: cancelledCount || 0,
    total: (waitingCount || 0) + (servingCount || 0) + (completedCount || 0) + (cancelledCount || 0)
  };
};

// Obtener datos de reportes por rango de tiempo
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
    console.error('Error al obtener reporte de tickets:', error);
    throw error;
  }

  return data.map(mapDatabaseTicketToTicket);
};

// Obtener tickets específicamente para reportes por período
export const getReportByPeriod = async (
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  startDate?: Date,
  endDate?: Date
): Promise<Ticket[]> => {
  const today = new Date();
  let queryStartDate: Date;
  let queryEndDate: Date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  if (period === 'custom' && startDate && endDate) {
    // Si es período personalizado, usar las fechas proporcionadas
    queryStartDate = new Date(startDate);
    queryEndDate = new Date(endDate);
    // Asegurarse de que la fecha final incluya todo el día
    queryEndDate.setHours(23, 59, 59, 999);
  } else {
    // Para períodos predefinidos
    switch(period) {
      case 'daily':
        queryStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'weekly':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando el día es domingo
        queryStartDate = new Date(today.getFullYear(), today.getMonth(), diff);
        break;
      case 'monthly':
        queryStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'yearly':
        queryStartDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        queryStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
  }
  
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .gte('created_at', queryStartDate.toISOString())
    .lt('created_at', queryEndDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error al obtener reporte ${period}:`, error);
    throw error;
  }

  return data.map(mapDatabaseTicketToTicket);
};
