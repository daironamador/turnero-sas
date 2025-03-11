
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

  return (
    <div className={`text-white p-4 animate-pulse ${ticket.isVip ? 'bg-yellow-500' : 'bg-ocular-500'}`}>
      <div className="container mx-auto flex items-center">
        <Bell className="w-6 h-6 mr-3 animate-bounce" />
        <span className="text-xl font-bold mr-2 flex items-center">
          Turno #{ticket.ticketNumber}
          {ticket.isVip && <Star className="ml-2 h-5 w-5" />}
        </span>
        <span className="text-xl">
          {rooms && ticket.counterNumber ? 
            `por favor dirigirse a ${rooms.find(r => r.id === ticket.counterNumber)?.name || `sala ${ticket.counterNumber}`}` : 
            "por favor dirigirse a recepción"}
        </span>
        <Volume2 className="w-6 h-6 ml-auto" />
      </div>
    </div>
  );
};

export default TicketNotification;
