
import { useEffect, useState, useRef } from 'react';
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
  const announcementTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const processTicketAnnouncement = (
    ticket: Ticket, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => {
    // Add guard to prevent duplicate announcement if already processing this ticket
    if (processingAnnouncement && lastAnnounced === ticket.id) {
      console.log(`Skipping duplicate announcement for ticket ${ticket.id}`);
      return;
    }

    // Check if this ticket was recently announced (within the last 3 seconds)
    if (lastAnnounced === ticket.id && 
        ticket.calledAt && 
        (Date.now() - ticket.calledAt.getTime() < 3000)) {
      console.log(`Skipping recently announced ticket ${ticket.id}`);
      return;
    }

    console.log(`Processing announcement for ticket ${ticket.ticketNumber} on display`);
    
    // Show the ticket on the display
    setNewlyCalledTicket(ticket);
    
    if (counterName) {
      console.log(`Announcing ticket ${ticket.ticketNumber} to ${counterName}`);
      
      setProcessingAnnouncement(true);
      setLastAnnounced(ticket.id);
      
      try {
        announceTicket(
          ticket.ticketNumber,
          counterName,
          redirectedFrom,
          originalRoomName
        );
        
        // Clear any existing timeout for this ticket
        if (announcementTimeouts.current.has(ticket.id)) {
          clearTimeout(announcementTimeouts.current.get(ticket.id));
        }
        
        // Set a new timeout to allow this ticket to be announced again after 3 seconds
        const timeoutId = setTimeout(() => {
          setProcessingAnnouncement(false);
          console.log(`Ready to process new announcements after ${ticket.ticketNumber}`);
        }, 3000);
        
        announcementTimeouts.current.set(ticket.id, timeoutId);
      } catch (error) {
        console.error('Error announcing ticket:', error);
        setProcessingAnnouncement(false);
      }
    } else {
      console.error('Missing room name for announcement');
      setProcessingAnnouncement(false);
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
          
          if (event.data.type === 'announce-ticket') {
            const { ticket, counterName, redirectedFrom, originalRoomName } = event.data;
            
            if (ticket && counterName) {
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
      
      // Clear all timeouts
      announcementTimeouts.current.forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [
    queryClient, 
    roomsQuery.data, 
    announceTicket, 
    setNewlyCalledTicket,
    lastAnnounced,
    setLastAnnounced
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
