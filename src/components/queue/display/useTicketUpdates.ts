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
        });
    
    channel.subscribe();
    
    // Create BroadcastChannel to listen for announcements from Call page
    const ticketChannel = new BroadcastChannel('ticket-announcements');
    
    ticketChannel.onmessage = (event) => {
      console.log('Received broadcast message in useTicketUpdates:', event.data);
      
      if (event.data.type === 'announce-ticket') {
        const { ticket, counterName, redirectedFrom, originalRoomName } = event.data;
        
        if (ticket) {
          // Update the display with the notification
          setNewlyCalledTicket(ticket);
          
          // Get the correct room name - use provided counterName or find it based on counterNumber
          let roomNameToUse = counterName;
          
          // Check if we received a valid counterName from the broadcast
          if (roomNameToUse) {
            console.log(`Announcing ticket ${ticket.ticketNumber} to room ${roomNameToUse}`);
            
            // Announce the ticket with the provided room name
            announceTicket(
              ticket.ticketNumber,
              roomNameToUse,
              redirectedFrom,
              originalRoomName
            );
            
            // Keep track of the last announced ticket ID
            setLastAnnounced(ticket.id);
          } else {
            console.error('Missing room name for announcement');
          }
        }
      }
    };
    
    return () => {
      supabase.removeChannel(channel);
      ticketChannel.close();
    };
  }, [
    queryClient, 
    roomsQuery.data, 
    announceTicket, 
    setNewlyCalledTicket, 
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
