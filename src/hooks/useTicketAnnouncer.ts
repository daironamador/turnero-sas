
import { useState, useEffect } from 'react';
import { Room, Ticket } from '@/lib/types';

export function useTicketAnnouncer() {
  const [ticketChannel, setTicketChannel] = useState<BroadcastChannel | null>(null);

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

  const announceTicket = (ticket: Ticket, counterName: string | undefined, rooms: Room[]) => {
    if (!counterName) {
      console.error("Cannot announce ticket: counterName is undefined");
      return;
    }
    
    if (!ticketChannel) {
      console.error("Cannot announce ticket: BroadcastChannel is unavailable");
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
    
    console.log("Broadcasting ticket announcement:", updatedTicket, "to counter:", counterName);
    
    try {
      ticketChannel.postMessage({
        type: 'announce-ticket',
        ticket: updatedTicket,
        counterName: counterName,
        redirectedFrom: ticket.redirectedFrom,
        originalRoomName: originalRoomName
      });
    } catch (error) {
      console.error("Failed to broadcast ticket announcement:", error);
    }
  };

  return { ticketChannel, announceTicket };
}
