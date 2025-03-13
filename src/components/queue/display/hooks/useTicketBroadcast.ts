
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Ticket } from '@/lib/types';

interface UseTicketBroadcastProps {
  processTicketAnnouncement: (
    ticket: Ticket, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => void;
}

export function useTicketBroadcast({
  processTicketAnnouncement
}: UseTicketBroadcastProps) {
  const queryClient = useQueryClient();
  
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
          
          queryClient.invalidateQueries({ queryKey: ['servingTickets'] });
          queryClient.invalidateQueries({ queryKey: ['waitingTickets'] });
        });
    
    channel.subscribe();
    
    let ticketChannel: BroadcastChannel | null = null;
    
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        ticketChannel = new BroadcastChannel('ticket-announcements');
        console.log('BroadcastChannel for ticket-announcements created successfully');
        
        ticketChannel.onmessage = (event) => {
          if (!event.data) return;
          
          console.log('Received broadcast message in useTicketUpdates:', event.data.type);
          
          if (event.data.type === 'announce-ticket') {
            const { ticket, counterName, redirectedFrom, originalRoomName } = event.data;
            
            if (ticket && counterName) {
              // Process announcement even if from a different device
              processTicketAnnouncement(ticket, counterName, redirectedFrom, originalRoomName);
            } else {
              console.error("Received invalid announcement data:", event.data);
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
    
    // Clean up
    return () => {
      supabase.removeChannel(channel);
      
      if (ticketChannel) {
        ticketChannel.close();
      }
    };
  }, [processTicketAnnouncement, queryClient]);
  
  return {};
}
