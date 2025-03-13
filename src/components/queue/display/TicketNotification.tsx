
import React, { useEffect, useRef, useState } from 'react';
import { Bell, Volume2, Star, AlertTriangle } from 'lucide-react';
import { Ticket } from '@/lib/types';
import { Room } from '@/lib/types';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TicketNotificationProps {
  ticket: Ticket | null;
  rooms: any[] | undefined;
}

const TicketNotification: React.FC<TicketNotificationProps> = ({ ticket, rooms }) => {
  const { announceTicket, isSpeaking } = useSpeechSynthesis();
  const announcementMade = useRef(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset error state when ticket changes
    if (ticket) {
      setAnnouncementError(null);
    }
  }, [ticket]);
  
  if (!ticket) return null;

  console.log("TicketNotification displaying ticket:", ticket);

  // Find room name safely
  let roomName = `sala ${ticket.counterNumber}`;
  if (rooms && ticket.counterNumber) {
    // Find the room that matches either the string or number ID
    const room = rooms.find(r => r.id === ticket.counterNumber || r.id === String(ticket.counterNumber));
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

  // Effect to announce the ticket when it first appears
  useEffect(() => {
    if (ticket && !announcementMade.current) {
      console.log(`Attempting to announce ticket ${displayNumber} to ${roomName}`);
      
      // Slight delay to ensure speech synthesis is ready
      const timeoutId = setTimeout(async () => {
        try {
          // Announce the ticket using speech synthesis
          let announcementText;
          if (ticket.redirectedFrom) {
            announcementText = await announceTicket(displayNumber, roomName, ticket.redirectedFrom, originalRoomName);
          } else {
            announcementText = await announceTicket(displayNumber, roomName);
          }
          
          if (!announcementText) {
            console.error("Announcement failed to generate text");
            setAnnouncementError("Error al anunciar turno por voz");
          }
          
          // Mark that we've announced this ticket
          announcementMade.current = true;
        } catch (error) {
          console.error("Error announcing ticket:", error);
          setAnnouncementError("Error al anunciar turno por voz");
        }
      }, 300);
      
      // Reset the flag when the component unmounts
      return () => {
        clearTimeout(timeoutId);
        announcementMade.current = false;
      };
    }
  }, [ticket, roomName, displayNumber, originalRoomName, announceTicket]);

  return (
    <>
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
          <Volume2 className={`w-6 h-6 ml-auto ${isSpeaking ? 'animate-pulse' : ''}`} />
        </div>
      </div>
      
      {announcementError && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {announcementError} - Abre la página de Display en otra pestaña para recibir anuncios de voz.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default TicketNotification;
