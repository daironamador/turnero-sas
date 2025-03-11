import { useEffect, useState } from 'react';
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
  const [processingAnnouncement, setProcessingAnnouncement] = useState(false);
  
  const processTicketAnnouncement = (
    ticket: Ticket, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => {
    if (lastAnnounced === ticket.id && Date.now() - (ticket.calledAt?.getTime() || 0) < 3000) {
      console.log(`Skipping already announced ticket ${ticket.id}`);
      return;
    }

    console.log(`Processing announcement for ticket ${ticket.ticketNumber} on display`);
    
    setNewlyCalledTicket(ticket);
    
    if (counterName) {
      console.log(`Announcing ticket ${ticket.ticketNumber} to ${counterName}`);
      
      setProcessingAnnouncement(true);
      
      try {
        announceTicket(
          ticket.ticketNumber,
          counterName,
          redirectedFrom,
          originalRoomName
        );
      } catch (error) {
        console.error('Error announcing ticket:', error);
      } finally {
        setLastAnnounced(ticket.id);
        
        setTimeout(() => {
          setProcessingAnnouncement(false);
        }, 3000);
      }
    } else {
      console.error('Missing room name for announcement');
    }
  };
  
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
          
          console.log('Received broadcast message in useTicketUpdates:', event.data);
          
          if (event.data.type === 'announce-ticket' && !processingAnnouncement) {
            const { ticket, counterName, redirectedFrom, originalRoomName } = event.data;
            
            if (ticket) {
              processTicketAnnouncement(ticket, counterName, redirectedFrom, originalRoomName);
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
    lastAnnounced,
    setLastAnnounced,
    processingAnnouncement
  ]);
  
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
