
import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { Ticket, Room } from '@/lib/types';

interface UseTicketUpdatesProps {
  roomsQuery: { data?: Room[]; refetch?: () => void };
  servingTicketsQuery: { data?: Ticket[]; refetch?: () => void };
  waitingTicketsQuery: { data?: Ticket[]; refetch?: () => void };
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
  const processedAnnouncements = useRef<Set<string>>(new Set());
  
  const processTicketAnnouncement = (
    ticket: Ticket, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => {
    // Check if the ticket already has a messageId from the BroadcastChannel
    // If not, create a unique key for this announcement to prevent duplicates
    const announcementKey = ticket.id || `${ticket.ticketNumber}-${Date.now()}`;
    
    // Check if we've already processed this specific announcement recently
    if (processedAnnouncements.current.has(announcementKey)) {
      console.log(`Skipping duplicate announcement for ticket ${ticket.ticketNumber} (${announcementKey})`);
      return;
    }
    
    // Add to processed set to prevent immediate duplicates
    processedAnnouncements.current.add(announcementKey);
    
    // Clean up processed set after some time - optimized for real-time
    setTimeout(() => {
      processedAnnouncements.current.delete(announcementKey);
    }, 5000);

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
        
        // Send acknowledgment back through BroadcastChannel
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const ackChannel = new BroadcastChannel('ticket-announcements');
            ackChannel.postMessage({
              type: 'announcement-received',
              ticketId: ticket.id,
              timestamp: Date.now()
            });
            
            // Close channel after sending - reduced delay for real-time
            setTimeout(() => {
              ackChannel.close();
            }, 50);
          } catch (error) {
            console.error('Error sending announcement acknowledgment:', error);
          }
        }
        
        // Clear any existing timeout for this ticket
        if (announcementTimeouts.current.has(ticket.id)) {
          clearTimeout(announcementTimeouts.current.get(ticket.id));
        }
        
        // Set a new timeout - reduced for real-time processing
        const timeoutId = setTimeout(() => {
          setProcessingAnnouncement(false);
          console.log(`Ready to process new announcements after ${ticket.ticketNumber}`);
        }, 1500);
        
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
    const processedMessageIds = new Map<string, number>();
    
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        ticketChannel = new BroadcastChannel('ticket-announcements');
        console.log('BroadcastChannel for ticket-announcements created successfully in Display');
        
        ticketChannel.onmessage = (event) => {
          if (!event.data) return;
          
          console.log('Received broadcast message in useTicketUpdates:', event.data.type);
          
          // Check if this message has a unique ID and if we've seen it before
          if (event.data.messageId) {
            const now = Date.now();
            const lastProcessed = processedMessageIds.get(event.data.messageId);
            
            // If processed recently (within 10 seconds), skip - reduced for real-time
            if (lastProcessed && (now - lastProcessed) < 10000) {
              console.log(`Skipping duplicate message with ID: ${event.data.messageId}`);
              return;
            }
            
            // Add this message ID with timestamp
            processedMessageIds.set(event.data.messageId, now);
            
            // Clean up old entries to prevent memory leaks - reduced time for real-time
            processedMessageIds.forEach((timestamp, id) => {
              if ((now - timestamp) > 10000) {
                processedMessageIds.delete(id);
              }
            });
          }
          
          if (event.data.type === 'announce-ticket' && !processingAnnouncement) {
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
