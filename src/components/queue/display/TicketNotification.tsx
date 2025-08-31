
import React, { useEffect, useRef, useState } from 'react';
import { Bell, Volume2, Star, AlertTriangle } from 'lucide-react';
import { Ticket } from '@/lib/types';
import { Room } from '@/lib/types';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TicketNotificationProps {
  ticket: Ticket | null;
  rooms: Room[] | undefined;
}

const TicketNotification: React.FC<TicketNotificationProps> = ({ ticket, rooms }) => {
  const { announceTicket, isSpeaking, isInitialized, initializeAudio } = useSpeechSynthesis();
  const announcementMade = useRef(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  
  // Initialize audio when component mounts
  useEffect(() => {
    initializeAudio().catch(error => {
      console.error('Failed to initialize audio:', error);
      setAnnouncementError('Error al inicializar audio');
    });
  }, [initializeAudio]);
  
  useEffect(() => {
    if (ticket && !announcementMade.current && isInitialized) {
      setAnnouncementError(null);
      console.log(`Announcing ticket ${ticket.ticketNumber}`);
      
      const timeoutId = setTimeout(async () => {
        try {
          // Find room name
          let roomName = `sala ${ticket.counterNumber}`;
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

          await announceTicket(
            ticket.ticketNumber,
            roomName,
            ticket.redirectedFrom,
            originalRoomName
          );
          
          announcementMade.current = true;
        } catch (error) {
          console.error('Error announcing ticket:', error);
          setAnnouncementError('Error al anunciar turno por voz');
        }
      }, 500);
      
      return () => {
        clearTimeout(timeoutId);
        announcementMade.current = false;
      };
    }
  }, [ticket, rooms, announceTicket, isInitialized]);

  const handleManualAnnouncement = async () => {
    if (!ticket) return;
    
    try {
      setAnnouncementError(null);
      
      let roomName = `sala ${ticket.counterNumber}`;
      if (rooms && ticket.counterNumber) {
        const room = rooms.find(r => 
          r.id === ticket.counterNumber || 
          r.id === String(ticket.counterNumber)
        );
        if (room) {
          roomName = room.name;
        }
      }

      let originalRoomName;
      if (ticket.redirectedFrom && rooms) {
        const originalRoom = rooms.find(r => 
          r.service && r.service.code === ticket.redirectedFrom
        );
        if (originalRoom) {
          originalRoomName = originalRoom.name;
        }
      }

      await announceTicket(
        ticket.ticketNumber,
        roomName,
        ticket.redirectedFrom,
        originalRoomName
      );
    } catch (error) {
      console.error('Error in manual announcement:', error);
      setAnnouncementError('Error al reproducir anuncio de voz');
    }
  };

  if (!ticket) return null;

  return (
    <>
      <div className={`text-white p-4 animate-pulse ${ticket.isVip ? 'bg-yellow-500' : 'bg-ocular-500'}`}>
        <div className="container mx-auto flex items-center">
          <Bell className="w-6 h-6 mr-3 animate-bounce" />
          <span className="text-xl font-bold mr-2 flex items-center">
            Turno {ticket.ticketNumber}
            {ticket.isVip && <Star className="ml-2 h-5 w-5" />}
          </span>
          <span className="text-xl">
            {ticket.redirectedFrom ? 
              `referido de ${rooms?.find(r => r.service?.code === ticket.redirectedFrom)?.name || `servicio ${ticket.redirectedFrom}`}, por favor dirigirse a ${rooms?.find(r => r.id === ticket.counterNumber)?.name || `sala ${ticket.counterNumber}`}` : 
              ticket.counterNumber ? 
                `por favor dirigirse a ${rooms?.find(r => r.id === ticket.counterNumber)?.name || `sala ${ticket.counterNumber}`}` : 
                "por favor dirigirse a recepción"}
          </span>
          <Volume2 
            className={`w-6 h-6 ml-auto cursor-pointer hover:scale-110 transition-transform ${isSpeaking ? 'animate-pulse' : ''}`} 
            onClick={handleManualAnnouncement}
          />
        </div>
      </div>
      
      {announcementError && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {announcementError} - Haz clic en el icono de altavoz para reproducir el anuncio manualmente.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default TicketNotification;
