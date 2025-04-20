
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Ticket, ServiceType } from '@/lib/types';

export function useTicketData(refreshInterval: number = 5000) {
  const [newlyCalledTicket, setNewlyCalledTicket] = useState<Ticket | null>(null);
  const [lastAnnounced, setLastAnnounced] = useState<string | null>(null);
  
  // Fetch current serving tickets
  const servingTicketsQuery = useQuery({
    queryKey: ['servingTickets'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('status', 'serving')
          .order('called_at', { ascending: false });
        
        if (error) throw error;
        
        return data.map(ticket => ({
          id: ticket.id,
          ticketNumber: ticket.ticket_number,
          serviceType: ticket.service_type as ServiceType,
          status: ticket.status,
          isVip: ticket.is_vip,
          createdAt: new Date(ticket.created_at),
          calledAt: ticket.called_at ? new Date(ticket.called_at) : undefined,
          completedAt: ticket.completed_at ? new Date(ticket.completed_at) : undefined,
          counterNumber: ticket.counter_number,
          patientName: ticket.patient_name,
          redirectedTo: ticket.redirected_to,
          redirectedFrom: ticket.redirected_from,
          previousTicketNumber: ticket.previous_ticket_number,
        }));
      } catch (error) {
        console.error("Error fetching serving tickets:", error);
        return [];
      }
    },
    refetchInterval: refreshInterval,
  });
  
  // Fetch waiting tickets
  const waitingTicketsQuery = useQuery({
    queryKey: ['waitingTickets'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('status', 'waiting')
          .order('created_at', { ascending: true })
          .limit(10);
        
        if (error) throw error;
        
        return data.map(ticket => ({
          id: ticket.id,
          ticketNumber: ticket.ticket_number,
          serviceType: ticket.service_type as ServiceType,
          status: ticket.status,
          isVip: ticket.is_vip,
          createdAt: new Date(ticket.created_at),
          calledAt: ticket.called_at ? new Date(ticket.called_at) : undefined,
          completedAt: ticket.completed_at ? new Date(ticket.completed_at) : undefined,
          counterNumber: ticket.counter_number,
          patientName: ticket.patient_name,
          redirectedTo: ticket.redirected_to,
          redirectedFrom: ticket.redirected_from,
          previousTicketNumber: ticket.previous_ticket_number,
        }));
      } catch (error) {
        console.error("Error fetching waiting tickets:", error);
        return [];
      }
    },
    refetchInterval: refreshInterval,
  });
  
  // Fetch room data
  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*, service:service_id(id, code, name)');
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error("Error fetching rooms:", error);
        return [];
      }
    },
  });

  return {
    servingTicketsQuery,
    waitingTicketsQuery,
    roomsQuery,
    newlyCalledTicket,
    setNewlyCalledTicket,
    lastAnnounced,
    setLastAnnounced
  };
}
