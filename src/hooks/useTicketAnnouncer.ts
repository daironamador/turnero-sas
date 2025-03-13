
import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, Ticket } from '@/lib/types';

export const useTicketAnnouncer = () => {
  const [ticketChannel, setTicketChannel] = useState<BroadcastChannel | null>(null);
  const [announcementQueue, setAnnouncementQueue] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const resendAttemptsRef = useRef<Map<string, number>>(new Map());
  const maxRetries = 3;

  // Initialize broadcast channel for cross-window/tab communication
  useEffect(() => {
    // Only create channel if BroadcastChannel is supported
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('ticket-announcements');
        setTicketChannel(channel);
        
        console.log("BroadcastChannel for ticket announcements initialized");
        
        // Setup message listener for acknowledgments
        channel.onmessage = (event) => {
          if (event.data?.type === 'announcement-received' && event.data?.ticketId) {
            console.log(`Received acknowledgment for ticket ${event.data.ticketId}`);
            // Clear any pending resend attempts for this ticket
            if (resendAttemptsRef.current.has(event.data.ticketId)) {
              resendAttemptsRef.current.delete(event.data.ticketId);
            }
          }
        };
        
        return () => {
          channel.close();
        };
      } catch (error) {
        console.error("Failed to create BroadcastChannel:", error);
      }
    } else {
      console.warn("BroadcastChannel not supported in this browser");
    }
  }, []);

  // Process the announcement queue
  useEffect(() => {
    if (announcementQueue.length > 0 && !isProcessing && ticketChannel) {
      setIsProcessing(true);
      
      // Get the next announcement
      const nextAnnouncement = announcementQueue[0];
      
      // Remove it from the queue
      setAnnouncementQueue(prev => prev.slice(1));
      
      // Send the announcement
      try {
        // Add a unique timestamp to prevent duplicate filtering
        const announcementWithTimestamp = {
          ...nextAnnouncement,
          messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now()
        };
        
        ticketChannel.postMessage(announcementWithTimestamp);
        console.log("Sent announcement from queue:", nextAnnouncement.ticket?.ticketNumber, "with ID:", announcementWithTimestamp.messageId);
        
        // Add a resend attempt after a delay if we don't receive acknowledgement
        const ticketId = nextAnnouncement.ticket?.id;
        if (ticketId) {
          const currentAttempts = resendAttemptsRef.current.get(ticketId) || 0;
          
          if (currentAttempts < maxRetries) {
            // Increment the retry counter for this ticket
            resendAttemptsRef.current.set(ticketId, currentAttempts + 1);
            
            // Wait for acknowledgment or resend
            setTimeout(() => {
              // Only resend if we haven't received an acknowledgment
              if (resendAttemptsRef.current.has(ticketId)) {
                console.log(`No acknowledgment received for ticket ${ticketId}, attempt ${currentAttempts + 1}/${maxRetries}`);
                setAnnouncementQueue(prev => [nextAnnouncement, ...prev]);
              }
            }, 3000); // Resend after 3 seconds if no acknowledgment
          } else {
            console.warn(`Max resend attempts (${maxRetries}) reached for ticket ${ticketId}`);
            resendAttemptsRef.current.delete(ticketId);
          }
        }
      } catch (error) {
        console.error("Failed to send queued announcement:", error);
      }
      
      // Allow the next announcement after a delay
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, [announcementQueue, isProcessing, ticketChannel]);

  const announceTicket = useCallback((ticket: Ticket, counterName: string, rooms: Room[]) => {
    if (!counterName) {
      console.error("Cannot announce ticket: counterName is undefined");
      return;
    }
    
    // Find the original room name if this is a redirected ticket
    let originalRoomName: string | undefined;
    if (ticket.redirectedFrom) {
      // Try to find the room with the matching service
      const possibleRooms = rooms.filter(
        r => r.service?.code === ticket.redirectedFrom
      );
      if (possibleRooms.length > 0) {
        originalRoomName = possibleRooms[0].name;
      } else {
        originalRoomName = `servicio ${ticket.redirectedFrom}`;
      }
    }
    
    // Ensure the ticket has a unique ID to prevent duplicate announcements
    const updatedTicket = {
      ...ticket,
      // Ensure we have the latest timestamp for display purposes
      calledAt: new Date()
    };
    
    const announcement = {
      type: 'announce-ticket',
      ticket: updatedTicket,
      counterName: counterName,
      redirectedFrom: ticket.redirectedFrom,
      originalRoomName: originalRoomName,
      timestamp: Date.now() // Add timestamp for debugging
    };
    
    console.log("Preparing ticket announcement:", updatedTicket.ticketNumber, "to counter:", counterName);
    
    // If we don't have a channel yet or if we're already processing, queue the announcement
    if (!ticketChannel || isProcessing) {
      console.log("Queueing announcement because", !ticketChannel ? "no channel" : "already processing");
      setAnnouncementQueue(prev => [...prev, announcement]);
      return;
    }
    
    // Reset retry counter for this ticket if there is an ID
    if (ticket && ticket.id) {
      resendAttemptsRef.current.set(ticket.id, 0);
    }
    
    try {
      // Add a unique messageId to prevent duplicate processing
      const announcementWithId = {
        ...announcement,
        messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      ticketChannel.postMessage(announcementWithId);
      console.log('Ticket announcement sent:', announcementWithId);
      return true;
    } catch (error) {
      console.error('Failed to send ticket announcement:', error);
      return false;
    }
  }, [ticketChannel, isProcessing]);

  return { ticketChannel, announceTicket };
};
