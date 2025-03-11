
import React from 'react';
import { Bell, Volume2, Star } from 'lucide-react';
import { Ticket } from '@/lib/types';
import { Room } from '@/lib/types';

interface TicketNotificationProps {
  ticket: Ticket | null;
  rooms: any[] | undefined;
}

const TicketNotification: React.FC<TicketNotificationProps> = ({ ticket, rooms }) => {
  if (!ticket) return null;

  // Find room name safely
  let roomName = `sala ${ticket.counterNumber}`;
  if (rooms && ticket.counterNumber) {
    const room = rooms.find(r => r.id === ticket.counterNumber);
    if (room) {
      roomName = room.name;
    }
  }

  // Find original room name for redirected tickets
  let originalRoomName = '';
  if (ticket.redirectedFrom && rooms) {
    // For redirected tickets, we need to find the original room
    // We'll use the service type to identify which rooms could have been the source
    const possibleRooms = rooms.filter(r => r.service?.code === ticket.redirectedFrom);
    if (possibleRooms.length > 0) {
      // We'll just use the first room with matching service as an approximation
      originalRoomName = possibleRooms[0].name;
    } else {
      originalRoomName = `servicio ${ticket.redirectedFrom}`;
    }
  }

  // Use the ticket's original number for display
  const displayNumber = ticket.ticketNumber || '';

  return (
    <div className={`text-white p-4 animate-pulse ${ticket.isVip ? 'bg-yellow-500' : 'bg-ocular-500'}`}>
      <div className="container mx-auto flex items-center">
        <Bell className="w-6 h-6 mr-3 animate-bounce" />
        <span className="text-xl font-bold mr-2 flex items-center">
          Turno {displayNumber}
          {ticket.isVip && <Star className="ml-2 h-5 w-5" />}
        </span>
        <span className="text-xl">
          {ticket.redirectedFrom ? 
            `referido de ${originalRoomName}, por favor dirigirse a ${roomName}` : 
            ticket.counterNumber ? 
              `por favor dirigirse a ${roomName}` : 
              "por favor dirigirse a recepción"}
        </span>
        <Volume2 className="w-6 h-6 ml-auto" />
      </div>
    </div>
  );
};

export default TicketNotification;
