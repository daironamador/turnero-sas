
import { useCallback } from 'react';
import { Ticket, Room } from '@/lib/types';

export function useTicketAnnouncer() {
  const announceTicket = useCallback((
    ticket: Ticket,
    counterName: string,
    rooms?: Room[]
  ): boolean => {
    try {
      // Create a unique message ID to prevent duplicates
      const messageId = `${ticket.id}-${Date.now()}`;
      
      // Find room information
      let roomName = counterName;
      if (rooms && ticket.counterNumber) {
        const room = rooms.find(r => 
          r.id === ticket.counterNumber || 
          r.id === String(ticket.counterNumber)
        );
        if (room) {
          roomName = room.name;
        }
      }
      
      // Find original room for redirected tickets
      let originalRoomName;
      if (ticket.redirectedFrom && rooms) {
        const originalRoom = rooms.find(r => 
          r.service && r.service.code === ticket.redirectedFrom
        );
        if (originalRoom) {
          originalRoomName = originalRoom.name;
        }
      }
      
      // Use BroadcastChannel to communicate with display screens
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel('ticket-announcements');
          
          channel.postMessage({
            type: 'announce-ticket',
            messageId,
            ticket: {
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              counterNumber: ticket.counterNumber,
              isVip: ticket.isVip,
              redirectedFrom: ticket.redirectedFrom,
              status: 'serving'
            },
            counterName: roomName,
            redirectedFrom: ticket.redirectedFrom,
            originalRoomName,
            timestamp: Date.now()
          });
          
          console.log(`Broadcast announcement for ticket ${ticket.ticketNumber} to ${roomName}`);
          
          // Close channel after sending
          setTimeout(() => {
            channel.close();
          }, 1000);
          
          return true;
        } catch (error) {
          console.error('Error broadcasting ticket announcement:', error);
          return false;
        }
      } else {
        console.warn('BroadcastChannel not supported, announcement skipped');
        return false;
      }
    } catch (error) {
      console.error('Error in ticket announcer:', error);
      return false;
    }
  }, []);
  
  return { announceTicket };
}
