
import React, { useEffect, useRef } from 'react';
import { Bell, Volume2, Star } from 'lucide-react';
import { Ticket } from '@/lib/types';
import { Room } from '@/lib/types';
import { useSpeechSynthesis } from './useSpeechSynthesis';

interface TicketNotificationProps {
  ticket: Ticket | null;
  rooms: any[] | undefined;
}

const TicketNotification: React.FC<TicketNotificationProps> = ({ ticket, rooms }) => {
  const { announceTicket, isSpeaking } = useSpeechSynthesis();
  const announcementMade = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // If no ticket is provided, render nothing but don't cause the screen to go blank
  if (!ticket) {
    return (
      <div className="hidden">
        {/* Hidden placeholder to prevent blank screen */}
      </div>
    );
  }

  console.log("TicketNotification displaying ticket:", ticket);

  // Find room name safely
  let roomName = `sala ${ticket.counterNumber || ''}`;
  if (rooms && ticket.counterNumber) {
    // Find the room that matches either the string or number ID
    const room = rooms.find(r => 
      r && r.id && (r.id === ticket.counterNumber || r.id === String(ticket.counterNumber))
    );
    if (room) {
      roomName = room.name || roomName;
    }
  }

  // Find original room name for redirected tickets
  let originalRoomName = '';
  if (ticket.redirectedFrom && rooms) {
    // For redirected tickets, we need to find the original room
    // We'll use the service type to identify which rooms could have been the source
    const possibleRooms = rooms.filter(r => r && r.service && r.service.code === ticket.redirectedFrom);
    if (possibleRooms.length > 0) {
      // We'll just use the first room with matching service as an approximation
      originalRoomName = possibleRooms[0].name || `servicio ${ticket.redirectedFrom}`;
    } else {
      originalRoomName = `servicio ${ticket.redirectedFrom}`;
    }
  }

  // Use the ticket's original number for display
  const displayNumber = ticket.ticketNumber || '';

  // Effect to announce the ticket when it first appears
  useEffect(() => {
    if (ticket && !announcementMade.current) {
      try {
        // Cancel any previous announcement timeouts
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Announce the ticket using speech synthesis
        if (ticket.redirectedFrom) {
          announceTicket(displayNumber, roomName, ticket.redirectedFrom, originalRoomName);
        } else {
          announceTicket(displayNumber, roomName);
        }
        
        // Mark that we've announced this ticket
        announcementMade.current = true;
        
        // Set a timeout to reset the announcement flag after a reasonable time
        timeoutRef.current = setTimeout(() => {
          announcementMade.current = false;
        }, 10000);
      } catch (error) {
        console.error("Error announcing ticket:", error);
        // Reset flag on error to allow future retry
        announcementMade.current = false;
      }
      
      // Reset the flag when the component unmounts
      return () => {
        announcementMade.current = false;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [ticket, roomName, displayNumber, originalRoomName, announceTicket]);

  return (
    <div className={`text-white p-4 animate-pulse ${ticket.isVip ? 'bg-yellow-500' : 'bg-ocular-500'}`}>
      <div className="container mx-auto flex items-center flex-wrap">
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
        <Volume2 className={`w-6 h-6 ml-auto ${isSpeaking ? 'animate-pulse' : ''}`} />
      </div>
    </div>
  );
};

export default TicketNotification;
