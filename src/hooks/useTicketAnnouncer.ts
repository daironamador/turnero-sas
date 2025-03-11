
import { useState, useEffect } from 'react';
import { Room, Ticket } from '@/lib/types';

export function useTicketAnnouncer() {
  const [ticketChannel, setTicketChannel] = useState<BroadcastChannel | null>(null);
  const [announcementQueue, setAnnouncementQueue] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize broadcast channel for cross-window/tab communication
  useEffect(() => {
    // Only create channel if BroadcastChannel is supported
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('ticket-announcements');
        setTicketChannel(channel);
        
        console.log("BroadcastChannel for ticket announcements initialized");
        
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
        ticketChannel.postMessage(nextAnnouncement);
        console.log("Sent announcement from queue:", nextAnnouncement);
      } catch (error) {
        console.error("Failed to send queued announcement:", error);
      }
      
      // Allow the next announcement after a delay
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  }, [announcementQueue, isProcessing, ticketChannel]);

  const announceTicket = (ticket: Ticket, counterName: string | undefined, rooms: Room[]) => {
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
      originalRoomName: originalRoomName
    };
    
    console.log("Preparing ticket announcement:", updatedTicket, "to counter:", counterName);
    
    // If we don't have a channel yet or if we're already processing, queue the announcement
    if (!ticketChannel || isProcessing) {
      console.log("Queueing announcement because", !ticketChannel ? "no channel" : "already processing");
      setAnnouncementQueue(prev => [...prev, announcement]);
      return;
    }
    
    try {
      ticketChannel.postMessage(announcement);
      console.log("Broadcast ticket announcement sent successfully");
    } catch (error) {
      console.error("Failed to broadcast ticket announcement:", error);
      
      // If sending fails, add to queue
      setAnnouncementQueue(prev => [...prev, announcement]);
    }
  };

  return { ticketChannel, announceTicket };
}
