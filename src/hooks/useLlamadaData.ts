
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getTicketsByStatus } from '@/services/ticketService';
import { Room, Service, Ticket } from '@/lib/types';
import { toast } from 'sonner';
import { useTicketAnnouncer } from './useTicketAnnouncer';

export function useLlamadaData() {
  const [selectedRoom, setSelectedRoom] = useState<(Room & { service: Service }) | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | undefined>(undefined);
  const { announceTicket } = useTicketAnnouncer();
  
  // Fetch waiting tickets
  const waitingTicketsQuery = useQuery({
    queryKey: ['waitingTickets'],
    queryFn: async () => {
      const tickets = await getTicketsByStatus('waiting');
      
      // Sort tickets: VIP tickets first, then regular tickets, both by creation date
      return tickets.sort((a, b) => {
        // First sort by VIP status (VIP tickets come first)
        if (a.isVip && !b.isVip) return -1;
        if (!a.isVip && b.isVip) return 1;
        
        // Then sort by creation date (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
  });

  // Fetch rooms with their services
  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, service:service_id(id, code, name)')
        .eq('is_active', true);
      
      if (error) {
        throw error;
      }
      
      return data as (Room & { service: Service })[];
    },
  });

  // Fetch services
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        throw error;
      }
      
      return data as Service[];
    },
  });

  // Fetch the current ticket being served at this room
  const fetchCurrentTicket = async () => {
    if (!selectedRoom) return;
    
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'serving')
        .eq('counter_number', selectedRoom.id)
        .order('called_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const ticket = {
          id: data[0].id,
          ticketNumber: data[0].ticket_number,
          serviceType: data[0].service_type,
          status: data[0].status,
          isVip: data[0].is_vip,
          createdAt: new Date(data[0].created_at),
          calledAt: data[0].called_at ? new Date(data[0].called_at) : undefined,
          completedAt: data[0].completed_at ? new Date(data[0].completed_at) : undefined,
          counterNumber: data[0].counter_number,
          patientName: data[0].patient_name,
          redirectedTo: data[0].redirected_to,
          redirectedFrom: data[0].redirected_from,
          previousTicketNumber: data[0].previous_ticket_number,
        };
        
        setCurrentTicket(ticket);
        
        // Announce the ticket whenever fetched
        if (roomsQuery.data && selectedRoom) {
          announceTicket(ticket, selectedRoom.name, roomsQuery.data);
        }
      } else {
        setCurrentTicket(undefined);
      }
    } catch (error) {
      console.error('Error fetching current ticket:', error);
      toast.error("Error al cargar el ticket actual");
    }
  };

  // Handle ticket changes (refresh data)
  const handleTicketChange = () => {
    waitingTicketsQuery.refetch();
    fetchCurrentTicket();
  };

  // Initial data fetching
  useEffect(() => {
    fetchCurrentTicket();
  }, [selectedRoom]);

  // Listen for real-time updates
  useEffect(() => {
    const handleTicketsUpdated = () => {
      handleTicketChange();
    };

    window.addEventListener('tickets-updated', handleTicketsUpdated);
    
    return () => {
      window.removeEventListener('tickets-updated', handleTicketsUpdated);
    };
  }, []);

  // Auto-select the first room when data loads
  useEffect(() => {
    if (roomsQuery.data && roomsQuery.data.length > 0 && !selectedRoom) {
      setSelectedRoom(roomsQuery.data[0]);
    }
  }, [roomsQuery.data]);

  return {
    selectedRoom,
    setSelectedRoom,
    currentTicket,
    waitingTicketsQuery,
    roomsQuery,
    servicesQuery,
    handleTicketChange,
    announceTicket
  };
}
