
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
  const { announceTicket, isSpeaking, isInitialized, initializeAudio } = useSpeechSynthesis();
  const announcementMade = useRef(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  
  // Intenta inicializar el audio cuando el componente se monta
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);
  
  useEffect(() => {
    if (ticket && !announcementMade.current) {
      setAnnouncementError(null);
      console.log(`Intentando anunciar ticket ${ticket.ticketNumber}`);
      
      // Pequeño retraso para asegurar que la síntesis de voz esté lista
      const timeoutId = setTimeout(async () => {
        try {
          // Encuentra el nombre de la sala
          let roomName = `sala ${ticket.counterNumber}`;
          if (rooms && ticket.counterNumber) {
            const room = rooms.find(r => r.id === ticket.counterNumber || r.id === String(ticket.counterNumber));
            if (room) {
              roomName = room.name;
            }
          }

          // Encuentra la sala original para tickets redirigidos
          let originalRoomName;
          if (ticket.redirectedFrom && rooms) {
            const possibleRooms = rooms.filter(r => r.service?.code === ticket.redirectedFrom);
            if (possibleRooms.length > 0) {
              originalRoomName = possibleRooms[0].name;
            } else {
              originalRoomName = `servicio ${ticket.redirectedFrom}`;
            }
          }

          // Anuncia el ticket - forzando la inicialización del audio si no está listo
          try {
            // Intenta inicializar el audio antes del anuncio
            await initializeAudio();
            
            const announcementText = await announceTicket(
              ticket.ticketNumber,
              roomName,
              ticket.redirectedFrom,
              originalRoomName
            );
            
            if (!announcementText) {
              console.error("No se generó texto para el anuncio");
              setAnnouncementError("Error al anunciar turno por voz");
            }
          } catch (error) {
            console.error("Error al anunciar el ticket:", error);
            setAnnouncementError("Error al anunciar turno por voz");
          }
          
          announcementMade.current = true;
        } catch (error) {
          console.error("Error en el proceso de anuncio:", error);
          setAnnouncementError("Error al anunciar turno por voz");
        }
      }, 500); // Aumentamos el tiempo de espera para dar más tiempo a la inicialización
      
      return () => {
        clearTimeout(timeoutId);
        announcementMade.current = false;
      };
    }
  }, [ticket, rooms, announceTicket, isInitialized, initializeAudio]);

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
            className={`w-6 h-6 ml-auto ${isSpeaking ? 'animate-pulse' : ''}`} 
            onClick={() => {
              if (ticket) {
                // Al hacer clic en el icono, intentar reproducir el anuncio nuevamente
                let roomName = `sala ${ticket.counterNumber}`;
                if (rooms && ticket.counterNumber) {
                  const room = rooms.find(r => r.id === ticket.counterNumber || r.id === String(ticket.counterNumber));
                  if (room) {
                    roomName = room.name;
                  }
                }

                let originalRoomName;
                if (ticket.redirectedFrom && rooms) {
                  const possibleRooms = rooms.filter(r => r.service?.code === ticket.redirectedFrom);
                  if (possibleRooms.length > 0) {
                    originalRoomName = possibleRooms[0].name;
                  } else {
                    originalRoomName = `servicio ${ticket.redirectedFrom}`;
                  }
                }

                announceTicket(
                  ticket.ticketNumber,
                  roomName,
                  ticket.redirectedFrom,
                  originalRoomName
                ).catch(error => {
                  console.error("Error al reproducir anuncio al hacer clic:", error);
                  setAnnouncementError("Error al reproducir anuncio de voz");
                });
              }
            }}
          />
        </div>
      </div>
      
      {announcementError && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {announcementError} - Prueba hacer clic en el icono de altavoz para reproducir el anuncio manualmente.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default TicketNotification;
