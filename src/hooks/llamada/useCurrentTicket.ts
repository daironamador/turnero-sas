
import { useState } from 'react';
import { toast } from 'sonner';
import { Room, Service, Ticket } from '@/lib/types';
import { useTicketAnnouncer } from '../useTicketAnnouncer';
import { supabase } from '@/lib/supabase';

export const useCurrentTicket = (selectedRoom: (Room & { service: Service }) | null, rooms: (Room & { service: Service })[] = []) => {
  const [currentTicket, setCurrentTicket] = useState<Ticket | undefined>(undefined);
  const { announceTicket } = useTicketAnnouncer();
  
  const fetchCurrentTicket = async () => {
    if (!selectedRoom) return;
    
    try {
      // Get current ticket serving in this counter
      const { data: ticketData, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'serving')
        .eq('counter_number', selectedRoom.id)
        .order('called_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error fetching current ticket:', error);
        toast.error("Error al cargar el ticket actual");
        return;
      }
      
      if (ticketData) {
        const ticket = {
          id: ticketData.id,
          ticketNumber: ticketData.ticket_number,
          serviceType: ticketData.service_type,
          status: ticketData.status,
          isVip: ticketData.is_vip,
          createdAt: new Date(ticketData.created_at),
          calledAt: ticketData.called_at ? new Date(ticketData.called_at) : undefined,
          completedAt: ticketData.completed_at ? new Date(ticketData.completed_at) : undefined,
          counterNumber: ticketData.counter_number,
          patientName: ticketData.patient_name,
          redirectedTo: ticketData.redirected_to,
          redirectedFrom: ticketData.redirected_from,
          previousTicketNumber: ticketData.previous_ticket_number,
        };
        
        setCurrentTicket(ticket);
        
        // Announce the ticket whenever fetched
        if (rooms && selectedRoom) {
          announceTicket(ticket, selectedRoom.name, rooms);
        }
      } else {
        setCurrentTicket(undefined);
      }
    } catch (error) {
      console.error('Error fetching current ticket:', error);
      toast.error("Error al cargar el ticket actual");
    }
  };

  return {
    currentTicket,
    setCurrentTicket,
    fetchCurrentTicket
  };
};
