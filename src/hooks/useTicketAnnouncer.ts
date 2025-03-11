
import { useState, useEffect } from 'react';
import { Room, Ticket } from '@/lib/types';

export function useTicketAnnouncer() {
  const [ticketChannel, setTicketChannel] = useState<BroadcastChannel | null>(null);

  // Initialize broadcast channel for cross-window/tab communication
  useEffect(() => {
    const channel = new BroadcastChannel('ticket-announcements');
    setTicketChannel(channel);
    
    return () => {
      channel.close();
    };
  }, []);

  const announceTicket = (ticket: Ticket, counterName: string | undefined, rooms: Room[]) => {
    if (!counterName || !ticketChannel) return;
    
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
    
    // Send message via BroadcastChannel to the display page
    const updatedTicket = {
      ...ticket,
      // Ensure we have the latest timestamp for display purposes
      calledAt: new Date()
    };
    
    console.log("Broadcasting ticket announcement:", updatedTicket, "to counter:", counterName);
    
    ticketChannel.postMessage({
      type: 'announce-ticket',
      ticket: updatedTicket,
      counterName: counterName,
      redirectedFrom: ticket.redirectedFrom,
      originalRoomName: originalRoomName
    });
  };

  return { ticketChannel, announceTicket };
}
