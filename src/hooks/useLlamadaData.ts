
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Room, Service, Ticket } from '@/lib/types';
import { getTicketsByStatus } from '@/services/ticketService';
import { useTicketAnnouncer } from './useTicketAnnouncer';
import { fetchRoomsWithServices, fetchActiveServices } from './llamada/useRoomService';
import { useCurrentTicket } from './llamada/useCurrentTicket';
import { supabase } from '@/lib/supabase';

export function useLlamadaData() {
  const [selectedRoom, setSelectedRoom] = useState<(Room & { service: Service }) | null>(null);
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
    queryFn: fetchRoomsWithServices,
  });

  // Fetch services
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: fetchActiveServices,
  });

  // Handle current ticket
  const { 
    currentTicket, 
    fetchCurrentTicket 
  } = useCurrentTicket(selectedRoom, roomsQuery.data);

  // Handle ticket changes (refresh data)
  const handleTicketChange = () => {
    waitingTicketsQuery.refetch();
    fetchCurrentTicket();
  };

  // Initial data fetching
  useEffect(() => {
    fetchCurrentTicket();
  }, [selectedRoom]);

  // Listen for real-time updates from Supabase
  useEffect(() => {
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        () => {
          handleTicketChange();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
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
