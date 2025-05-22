
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, ServiceType } from '@/lib/types';
import { supabase } from '@/lib/supabase';

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
        
        if (error) {
          console.error("Error fetching serving tickets:", error);
          return [];
        }
        
        return data.map(row => ({
          id: row.id,
          ticketNumber: row.ticket_number,
          serviceType: row.service_type as ServiceType,
          status: row.status,
          isVip: row.is_vip,
          createdAt: new Date(row.created_at),
          calledAt: row.called_at ? new Date(row.called_at) : undefined,
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          counterNumber: row.counter_number,
          patientName: row.patient_name,
          redirectedTo: row.redirected_to,
          redirectedFrom: row.redirected_from,
          previousTicketNumber: row.previous_ticket_number,
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
        
        if (error) {
          console.error("Error fetching waiting tickets:", error);
          return [];
        }
        
        return data.map(row => ({
          id: row.id,
          ticketNumber: row.ticket_number,
          serviceType: row.service_type as ServiceType,
          status: row.status,
          isVip: row.is_vip,
          createdAt: new Date(row.created_at),
          calledAt: row.called_at ? new Date(row.called_at) : undefined,
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          counterNumber: row.counter_number,
          patientName: row.patient_name,
          redirectedTo: row.redirected_to,
          redirectedFrom: row.redirected_from,
          previousTicketNumber: row.previous_ticket_number,
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
          .select(`
            *,
            services:service_id (*)
          `);
        
        if (error) {
          console.error("Error fetching rooms:", error);
          return [];
        }
        
        return data.map(room => ({
          ...room,
          service: room.services
        }));
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
