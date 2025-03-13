
import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, Ticket } from '@/lib/types';

export const useTicketAnnouncer = () => {
  const [ticketChannel, setTicketChannel] = useState<BroadcastChannel | null>(null);
  const [announcementQueue, setAnnouncementQueue] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const resendAttemptsRef = useRef<Map<string, number>>(new Map());
  const deviceId = useRef<string>(localStorage.getItem('deviceId') || `device-${Math.random().toString(36).substring(2, 9)}`);
  const maxRetries = 5; // Increased retries for better reliability
  const displayDevices = useRef<Set<string>>(new Set());

  // Save device ID for persistence
  useEffect(() => {
    if (!localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', deviceId.current);
    }
  }, []);

  // Initialize broadcast channel for cross-window/tab/device communication
  useEffect(() => {
    // Only create channel if BroadcastChannel is supported
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('ticket-announcements');
        setTicketChannel(channel);
        
        console.log("BroadcastChannel for ticket announcements initialized with device ID:", deviceId.current);
        
        // Setup message listener for acknowledgments and device discovery
        channel.onmessage = (event) => {
          if (!event.data?.type) return;
          
          // Handle acknowledgments
          if (event.data.type === 'announcement-received' && event.data?.ticketId) {
            console.log(`Received acknowledgment for ticket ${event.data.ticketId} from device ${event.data.deviceId}`);
            
            // Track display devices
            if (event.data.deviceId && event.data.deviceId !== deviceId.current) {
              displayDevices.current.add(event.data.deviceId);
              console.log(`Known display devices: ${Array.from(displayDevices.current).join(', ')}`);
            }
            
            // Clear any pending resend attempts for this ticket
            if (resendAttemptsRef.current.has(event.data.ticketId)) {
              resendAttemptsRef.current.delete(event.data.ticketId);
            }
          }
          
          // Handle device announcements
          if (event.data.type === 'display-device-online') {
            console.log(`Display device online: ${event.data.deviceId}`);
            displayDevices.current.add(event.data.deviceId);
            
            // Announce our presence back
            channel.postMessage({
              type: 'display-device-online-ack',
              deviceId: deviceId.current,
              timestamp: Date.now()
            });
          }
          
          // Handle device acknowledgments
          if (event.data.type === 'display-device-online-ack') {
            console.log(`Display device acknowledged: ${event.data.deviceId}`);
            displayDevices.current.add(event.data.deviceId);
          }
        };
        
        // Announce presence to discover other devices
        channel.postMessage({
          type: 'display-device-online',
          deviceId: deviceId.current,
          timestamp: Date.now()
        });
        
        // Periodically check for display devices
        const presenceInterval = setInterval(() => {
          if (channel && typeof window !== 'undefined') {
            channel.postMessage({
              type: 'display-device-online',
              deviceId: deviceId.current,
              timestamp: Date.now()
            });
          }
        }, 30000);
        
        return () => {
          clearInterval(presenceInterval);
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
        ticketChannel.postMessage(nextAnnouncement);
        console.log("Sent announcement from queue:", nextAnnouncement.ticket?.ticketNumber);
        
        // Add a resend attempt after a delay if we don't receive acknowledgement
        const ticketId = nextAnnouncement.ticket?.id;
        if (ticketId) {
          const currentAttempts = resendAttemptsRef.current.get(ticketId) || 0;
          
          if (currentAttempts < maxRetries) {
            // Increment the retry counter for this ticket
            resendAttemptsRef.current.set(ticketId, currentAttempts + 1);
            
            // Wait for acknowledgment or resend with exponential backoff
            const backoffTime = Math.min(1000 * Math.pow(1.5, currentAttempts), 10000);
            
            setTimeout(() => {
              // Only resend if we haven't received an acknowledgment
              if (resendAttemptsRef.current.has(ticketId)) {
                console.log(`No acknowledgment received for ticket ${ticketId}, attempt ${currentAttempts + 1}/${maxRetries} (backoff: ${backoffTime}ms)`);
                
                // If we have known display devices, but none are responding, log this info
                if (displayDevices.current.size > 0) {
                  console.log(`There are ${displayDevices.current.size} known display devices, but none acknowledged. Retrying.`);
                } else {
                  console.warn(`No known display devices detected. Announcements may not be heard.`);
                }
                
                setAnnouncementQueue(prev => [nextAnnouncement, ...prev]);
              }
            }, backoffTime);
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
      timestamp: Date.now(), // Add timestamp for debugging
      sourceDeviceId: deviceId.current // Add source device ID for tracking
    };
    
    console.log("Preparing ticket announcement:", updatedTicket.ticketNumber, "to counter:", counterName);
    
    // Log if we have known display devices
    if (displayDevices.current.size > 0) {
      console.log(`Sending announcement to ${displayDevices.current.size} known display devices`);
    } else {
      console.warn("No known display devices detected. Announcement may not be heard.");
    }
    
    // If we don't have a channel yet or if we're already processing, queue the announcement
    if (!ticketChannel || isProcessing) {
      console.log("Queueing announcement because", !ticketChannel ? "no channel" : "already processing");
      setAnnouncementQueue(prev => [...prev, announcement]);
      return false;
    }
    
    // Reset retry counter for this ticket if there is an ID
    if (ticket && ticket.id) {
      resendAttemptsRef.current.set(ticket.id, 0);
    }
    
    try {
      ticketChannel.postMessage(announcement);
      console.log('Ticket announcement sent:', announcement);
      return true;
    } catch (error) {
      console.error('Failed to send ticket announcement:', error);
      // Queue it in case of error
      setAnnouncementQueue(prev => [...prev, announcement]);
      return false;
    }
  }, []);

  return { ticketChannel, announceTicket, hasDisplayDevices: () => displayDevices.current.size > 0 };
};
