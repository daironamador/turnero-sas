
import { useCallback } from 'react';
import { Ticket, Room } from '@/lib/types';
import { toast } from 'sonner';

export function useTicketAnnouncer() {
  
  // Function to create announcement text
  const createAnnouncementText = useCallback((
    ticketNumber: string,
    counterName: string,
    redirectedFrom?: string,
    originalRoomName?: string
  ): string => {
    // Format ticket number for better pronunciation
    const formattedNumber = ticketNumber.replace(/[^a-zA-Z0-9]/g, '').split('').join(' ');
    
    if (redirectedFrom && originalRoomName) {
      return `Turno ${formattedNumber}, referido de ${originalRoomName}, pasar a ${counterName}`;
    }
    
    return `Turno ${formattedNumber}, pasar a ${counterName}`;
  }, []);

  // Function to speak announcement directly (fallback when no display screen)
  const speakAnnouncement = useCallback(async (
    ticketNumber: string,
    counterName: string,
    redirectedFrom?: string,
    originalRoomName?: string
  ): Promise<boolean> => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return false;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const text = createAnnouncementText(ticketNumber, counterName, redirectedFrom, originalRoomName);
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure speech
      utterance.volume = 1;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.lang = 'es-419';

      // Try to find a Spanish voice
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => 
        voice.lang.includes('es') || voice.name.toLowerCase().includes('spanish')
      );
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
        utterance.lang = spanishVoice.lang;
      }

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Speech timeout');
          resolve(false);
        }, 5000);

        utterance.onend = () => {
          clearTimeout(timeout);
          console.log('Speech completed successfully');
          resolve(true);
        };

        utterance.onerror = (error) => {
          clearTimeout(timeout);
          console.error('Speech error:', error);
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);

        // Fallback check - reduced delay for real-time
        setTimeout(() => {
          if (!window.speechSynthesis.speaking) {
            console.log('Speech may not have started, retrying...');
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }
        }, 200);
      });
    } catch (error) {
      console.error('Error in speech announcement:', error);
      return false;
    }
  }, [createAnnouncementText]);

  const announceTicket = useCallback(async (
    ticket: Ticket,
    counterName: string,
    rooms?: Room[]
  ): Promise<boolean> => {
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
      
      let broadcastSuccess = false;
      let speechSuccess = false;

      // 1. Use BroadcastChannel to communicate with display screens
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
          broadcastSuccess = true;
          
          // Close channel after sending - reduced delay for real-time
          setTimeout(() => {
            channel.close();
          }, 100);
          
        } catch (error) {
          console.error('Error broadcasting ticket announcement:', error);
        }
      } else {
        console.warn('BroadcastChannel not supported');
      }

      // 2. Also speak directly on this page (fallback and immediate feedback)
      try {
        speechSuccess = await speakAnnouncement(
          ticket.ticketNumber,
          roomName,
          ticket.redirectedFrom,
          originalRoomName
        );

        if (speechSuccess) {
          console.log(`Direct speech announcement successful for ticket ${ticket.ticketNumber}`);
          toast.success(`Anuncio reproducido: ${ticket.ticketNumber}`);
        } else {
          console.warn(`Direct speech announcement failed for ticket ${ticket.ticketNumber}`);
          if (!broadcastSuccess) {
            toast.warning("No se pudo reproducir el anuncio de voz");
          }
        }
      } catch (error) {
        console.error('Error in direct speech announcement:', error);
      }

      // Return true if at least one method worked
      return broadcastSuccess || speechSuccess;
    } catch (error) {
      console.error('Error in ticket announcer:', error);
      return false;
    }
  }, []);
  
  return { announceTicket };
}
