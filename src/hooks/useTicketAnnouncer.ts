
import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, Ticket } from '@/lib/types';
import { toast } from 'sonner';

export const useTicketAnnouncer = () => {
  const [ticketChannel, setTicketChannel] = useState<BroadcastChannel | null>(null);
  const [announcementQueue, setAnnouncementQueue] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const resendAttemptsRef = useRef<Map<string, number>>(new Map());
  const maxRetries = 3;
  const lastAnnouncedRef = useRef<{id: string, timestamp: number} | null>(null);

  // Inicializar canal de broadcast para comunicación entre ventanas/pestañas
  useEffect(() => {
    // Sólo crear canal si BroadcastChannel es soportado
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('ticket-announcements');
        setTicketChannel(channel);
        
        console.log("BroadcastChannel para anuncios de tickets inicializado");
        
        // Configurar listener de mensajes para confirmaciones
        channel.onmessage = (event) => {
          if (event.data?.type === 'announcement-received' && event.data?.ticketId) {
            console.log(`Recibida confirmación para ticket ${event.data.ticketId}`);
            // Limpiar cualquier intento pendiente de reenvío para este ticket
            if (resendAttemptsRef.current.has(event.data.ticketId)) {
              resendAttemptsRef.current.delete(event.data.ticketId);
            }
          }
        };
        
        // Reproducir un sonido silencioso para activar las capacidades de audio
        try {
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(0, audioContext.currentTime); // Frecuencia 0 para que sea silencioso
          oscillator.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.01);
          audioContext.close();
        } catch (e) {
          console.log("No se pudo inicializar el contexto de audio:", e);
        }
        
        return () => {
          channel.close();
        };
      } catch (error) {
        console.error("Error al crear BroadcastChannel:", error);
      }
    } else {
      console.warn("BroadcastChannel no es soportado en este navegador");
    }
  }, []);

  // Procesar la cola de anuncios
  useEffect(() => {
    if (announcementQueue.length > 0 && !isProcessing && ticketChannel) {
      setIsProcessing(true);
      
      // Obtener el siguiente anuncio
      const nextAnnouncement = announcementQueue[0];
      
      // Eliminarlo de la cola
      setAnnouncementQueue(prev => prev.slice(1));
      
      // Enviar el anuncio
      try {
        // Añadir un timestamp único para prevenir filtrado de duplicados
        const announcementWithTimestamp = {
          ...nextAnnouncement,
          messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now()
        };
        
        ticketChannel.postMessage(announcementWithTimestamp);
        console.log("Anuncio enviado desde cola:", nextAnnouncement.ticket?.ticketNumber, "con ID:", announcementWithTimestamp.messageId);
        
        // Añadir un intento de reenvío después de un retraso si no recibimos confirmación
        const ticketId = nextAnnouncement.ticket?.id;
        if (ticketId) {
          const currentAttempts = resendAttemptsRef.current.get(ticketId) || 0;
          
          if (currentAttempts < maxRetries) {
            // Incrementar el contador de reintentos para este ticket
            resendAttemptsRef.current.set(ticketId, currentAttempts + 1);
            
            // Esperar por confirmación o reenviar
            setTimeout(() => {
              // Solo reenviar si no hemos recibido una confirmación
              if (resendAttemptsRef.current.has(ticketId)) {
                console.log(`No se recibió confirmación para ticket ${ticketId}, intento ${currentAttempts + 1}/${maxRetries}`);
                setAnnouncementQueue(prev => [nextAnnouncement, ...prev]);
              }
            }, 3000); // Reenviar después de 3 segundos si no hay confirmación
          } else {
            console.warn(`Máximos intentos de reenvío (${maxRetries}) alcanzados para ticket ${ticketId}`);
            resendAttemptsRef.current.delete(ticketId);
          }
        }
      } catch (error) {
        console.error("Error al enviar anuncio en cola:", error);
      }
      
      // Permitir el siguiente anuncio después de un retraso
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, [announcementQueue, isProcessing, ticketChannel]);

  const announceTicket = useCallback((ticket: Ticket, counterName: string, rooms: Room[]) => {
    console.log("Anunciando ticket:", ticket.ticketNumber, "a sala:", counterName);
    
    if (!counterName) {
      console.error("No se puede anunciar ticket: counterName es undefined");
      return false;
    }
    
    // Prevenir anuncios duplicados en un corto período de tiempo
    if (lastAnnouncedRef.current && lastAnnouncedRef.current.id === ticket.id) {
      const timeSinceLastAnnouncement = Date.now() - lastAnnouncedRef.current.timestamp;
      if (timeSinceLastAnnouncement < 3000) { // 3 segundos
        console.log(`Omitiendo anuncio duplicado para ticket ${ticket.id} - anunciado hace ${timeSinceLastAnnouncement}ms`);
        return true;
      }
    }
    
    // Actualizar referencia del último anunciado
    lastAnnouncedRef.current = {
      id: ticket.id,
      timestamp: Date.now()
    };
    
    // Encontrar el nombre de sala original si este es un ticket redirigido
    let originalRoomName: string | undefined;
    if (ticket.redirectedFrom) {
      // Intentar encontrar la sala con el servicio coincidente
      const possibleRooms = rooms.filter(
        r => r.service?.code === ticket.redirectedFrom
      );
      if (possibleRooms.length > 0) {
        originalRoomName = possibleRooms[0].name;
      } else {
        originalRoomName = `servicio ${ticket.redirectedFrom}`;
      }
    }
    
    // Asegurar que el ticket tiene un ID único para prevenir anuncios duplicados
    const updatedTicket = {
      ...ticket,
      // Asegurar que tenemos el timestamp más reciente para propósitos de visualización
      calledAt: new Date()
    };
    
    const announcement = {
      type: 'announce-ticket',
      ticket: updatedTicket,
      counterName: counterName,
      redirectedFrom: ticket.redirectedFrom,
      originalRoomName: originalRoomName,
      timestamp: Date.now() // Añadir timestamp para depuración
    };
    
    console.log("Preparando anuncio de ticket:", updatedTicket.ticketNumber, "a sala:", counterName);
    
    // Si no tenemos un canal todavía o si ya estamos procesando, poner en cola el anuncio
    if (!ticketChannel || isProcessing) {
      console.log("Poniendo anuncio en cola debido a", !ticketChannel ? "no hay canal" : "ya procesando");
      setAnnouncementQueue(prev => [...prev, announcement]);
      return true;
    }
    
    // Reiniciar contador de reintentos para este ticket si hay un ID
    if (ticket && ticket.id) {
      resendAttemptsRef.current.set(ticket.id, 0);
    }
    
    try {
      // Añadir un único messageId para prevenir procesamiento duplicado
      const announcementWithId = {
        ...announcement,
        messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      // Reproducir un sonido silencioso para activar las capacidades de audio en móviles
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.setValueAtTime(0, audioContext.currentTime);
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.01);
      } catch (e) {
        console.log("No se pudo activar audio:", e);
      }
      
      ticketChannel.postMessage(announcementWithId);
      console.log('Anuncio de ticket enviado:', announcementWithId);
      
      // Si estamos en un dispositivo móvil, mostrar toast para indicar que el anuncio fue enviado
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        toast.success("Anuncio enviado a pantallas", {
          description: `Turno ${ticket.ticketNumber} a ${counterName}`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error al enviar anuncio de ticket:', error);
      toast.error("Error al enviar anuncio");
      return false;
    }
  }, [ticketChannel, isProcessing]);

  return { ticketChannel, announceTicket };
};
