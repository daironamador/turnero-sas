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
    let ticketChannel: BroadcastChannel | null = null;
    
    // Check if BroadcastChannel is supported in this browser
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        ticketChannel = new BroadcastChannel('ticket-announcements');
        console.log('BroadcastChannel for ticket-announcements created successfully');
        
        ticketChannel.onmessage = (event) => {
          console.log('Received broadcast message in useTicketUpdates:', event.data);
          
          if (event.data.type === 'announce-ticket') {
            const { ticket, counterName, redirectedFrom, originalRoomName } = event.data;
            
            if (ticket) {
              // Prevent double processing the same ticket
              if (lastAnnounced === ticket.id) {
                console.log(`Skipping already announced ticket ${ticket.id}`);
                return;
              }
              
              console.log(`Processing announcement for ticket ${ticket.ticketNumber} on display`);
              
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
        
        ticketChannel.onmessageerror = (event) => {
          console.error('Error receiving message:', event);
        };
      } catch (error) {
        console.error('Error creating BroadcastChannel:', error);
      }
    } else {
      console.warn('BroadcastChannel not supported in this browser');
    }
    
    return () => {
      supabase.removeChannel(channel);
      if (ticketChannel) {
        ticketChannel.close();
      }
    };
  }, [
    queryClient, 
    roomsQuery.data, 
    announceTicket, 
    setNewlyCalledTicket,
    lastAnnounced, // Keep this dependency to listen for changes
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
