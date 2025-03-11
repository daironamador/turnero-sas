
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { Ticket } from '@/lib/types';

interface UseTicketUpdatesProps {
  roomsQuery: any;
  servingTicketsQuery: any;
  waitingTicketsQuery: any; // Changed from lastCalledTicketsQuery
  newlyCalledTicket: Ticket | null;
  setNewlyCalledTicket: (ticket: Ticket | null) => void;
  lastAnnounced: string | null;
  setLastAnnounced: (id: string | null) => void;
}

export function useTicketUpdates({
  roomsQuery,
  servingTicketsQuery,
  waitingTicketsQuery, // Changed from lastCalledTicketsQuery
  newlyCalledTicket,
  setNewlyCalledTicket,
  lastAnnounced,
  setLastAnnounced
}: UseTicketUpdatesProps) {
  const queryClient = useQueryClient();
  const { announceTicket } = useSpeechSynthesis();
  
  // Set up real-time listener for ticket changes
  useEffect(() => {
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets'
        }, 
        (payload) => {
          console.info('Cambio en tickets recibido!', payload);
          
          // Refresh the queries to get updated data
          queryClient.invalidateQueries({ queryKey: ['servingTickets'] });
          queryClient.invalidateQueries({ queryKey: ['waitingTickets'] }); // Changed from 'lastCalledTickets'
          
          // Handle newly called tickets
          if (payload.eventType === 'UPDATE' && payload.new.status === 'serving') {
            const calledTicket = {
              id: payload.new.id,
              ticketNumber: payload.new.ticket_number,
              serviceType: payload.new.service_type,
              status: payload.new.status,
              isVip: payload.new.is_vip,
              createdAt: new Date(payload.new.created_at),
              calledAt: payload.new.called_at ? new Date(payload.new.called_at) : undefined,
              counterNumber: payload.new.counter_number,
            } as Ticket;
            
            setNewlyCalledTicket(calledTicket);
            
            // Only announce if this is a new call (not already announced)
            if (lastAnnounced !== calledTicket.id) {
              // Find room name
              let roomName = `sala ${calledTicket.counterNumber}`;
              if (roomsQuery.data && calledTicket.counterNumber) {
                const room = roomsQuery.data.find((r: any) => r.id === calledTicket.counterNumber);
                if (room) {
                  roomName = room.name;
                }
              }
              
              // Announce the called ticket
              announceTicket(calledTicket.ticketNumber, roomName);
              setLastAnnounced(calledTicket.id);
            }
          }
        });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    queryClient, 
    roomsQuery.data, 
    announceTicket, 
    setNewlyCalledTicket, 
    lastAnnounced, 
    setLastAnnounced
  ]);
  
  // Clear notification after 10 seconds
  useEffect(() => {
    if (newlyCalledTicket) {
      const timer = setTimeout(() => {
        setNewlyCalledTicket(null);
      }, 10000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [newlyCalledTicket, setNewlyCalledTicket]);
}
