import { useState, useRef, useEffect } from 'react';
import { Ticket } from '@/lib/types';

interface UseTicketAnnouncementProps {
  setNewlyCalledTicket: (ticket: Ticket | null) => void;
  setLastAnnounced: (id: string | null) => void;
}

export function useTicketAnnouncement({
  setNewlyCalledTicket,
  setLastAnnounced
}: UseTicketAnnouncementProps) {
  const [processingAnnouncement, setProcessingAnnouncement] = useState(false);
  const announcementTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const processedAnnouncements = useRef<Set<string>>(new Set());
  const deviceId = useRef<string>(localStorage.getItem('deviceId') || `device-${Math.random().toString(36).substring(2, 9)}`);
  
  // Save device ID to localStorage for persistence
  useEffect(() => {
    if (!localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', deviceId.current);
    }
  }, []);
  
  const processTicketAnnouncement = (
    ticket: Ticket, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => {
    if (!ticket || !ticket.id) {
      console.error('Invalid ticket received for announcement');
      return;
    }

    // Create a unique key for this announcement to prevent duplicates
    const announcementKey = `${ticket.id}-${Date.now()}`;
    
    // Check if we've already processed this specific announcement recently
    if (processedAnnouncements.current.has(announcementKey)) {
      console.log(`Skipping duplicate announcement for ticket ${ticket.ticketNumber} (${announcementKey})`);
      return;
    }
    
    // Add to processed set to prevent immediate duplicates
    processedAnnouncements.current.add(announcementKey);
    
    // Clean up processed set after some time to prevent memory leaks
    setTimeout(() => {
      processedAnnouncements.current.delete(announcementKey);
    }, 10000);

    console.log(`Processing announcement for ticket ${ticket.ticketNumber} on display`);
    
    try {
      // Show the ticket on the display - do this first before any potential errors
      setNewlyCalledTicket(ticket);
      
      if (counterName) {
        console.log(`Announcing ticket ${ticket.ticketNumber} to ${counterName}`);
        
        setProcessingAnnouncement(true);
        setLastAnnounced(ticket.id);
        
        try {
          // Announce with device ID context to help with multi-device coordination
          if (typeof BroadcastChannel !== 'undefined') {
            try {
              const ackChannel = new BroadcastChannel('ticket-announcements');
              ackChannel.postMessage({
                type: 'announcement-received',
                ticketId: ticket.id,
                deviceId: deviceId.current,
                timestamp: Date.now()
              });
              
              // Close channel after sending
              setTimeout(() => {
                ackChannel.close();
              }, 1000);
            } catch (error) {
              console.error('Error sending announcement acknowledgment:', error);
            }
          }
          
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
    } catch (error) {
      console.error('Error in ticket announcement process:', error);
      setProcessingAnnouncement(false);
    }
  };
  
  return {
    processTicketAnnouncement,
    processingAnnouncement,
    deviceId: deviceId.current
  };
}
