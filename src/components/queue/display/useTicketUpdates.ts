
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { Ticket } from '@/lib/types';

interface UseTicketUpdatesProps {
  roomsQuery: any;
  servingTicketsQuery: any;
  waitingTicketsQuery: any;
  newlyCalledTicket: Ticket | null;
  setNewlyCalledTicket: (ticket: Ticket | null) => void;
  lastAnnounced: string | null;
  setLastAnnounced: (id: string | null) => void;
}

export function useTicketUpdates({
  roomsQuery,
  servingTicketsQuery,
  waitingTicketsQuery,
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
          queryClient.invalidateQueries({ queryKey: ['waitingTickets'] });
          
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
              redirectedFrom: payload.new.redirected_from,
              previousTicketNumber: payload.new.previous_ticket_number
            } as Ticket;
            
            setNewlyCalledTicket(calledTicket);
            
            // Only announce if this is a new call (not already announced)
            if (lastAnnounced !== calledTicket.id) {
              // Find room name for current counter
              let roomName = `sala ${calledTicket.counterNumber}`;
              if (roomsQuery.data && calledTicket.counterNumber) {
                const room = roomsQuery.data.find((r: any) => r.id === calledTicket.counterNumber);
                if (room) {
                  roomName = room.name;
                }
              }
              
              // For redirected tickets, find the original room name
              let originalRoomName = undefined;
              if (calledTicket.redirectedFrom && roomsQuery.data) {
                // We look for rooms with the matching service type (where the ticket came from)
                const possibleRooms = roomsQuery.data.filter(
                  (r: any) => r.service?.code === calledTicket.redirectedFrom
                );
                if (possibleRooms.length > 0) {
                  originalRoomName = possibleRooms[0].name;
                } else {
                  originalRoomName = `servicio ${calledTicket.redirectedFrom}`;
                }
              }
              
              // Announce the called ticket with redirection info if applicable
              announceTicket(
                calledTicket.ticketNumber, 
                roomName, 
                calledTicket.redirectedFrom, 
                originalRoomName
              );
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
